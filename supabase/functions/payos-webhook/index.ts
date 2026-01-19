import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import PayOS from "npm:@payos/node";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const data = await req.json()
        const { code, desc, data: paymentData, signature } = data

        // 1. Initialize PayOS
        const payos = new PayOS(
            Deno.env.get('PAYOS_CLIENT_ID')!,
            Deno.env.get('PAYOS_API_KEY')!,
            Deno.env.get('PAYOS_CHECKSUM_KEY')!
        );

        // 2. Verify webhook data (Ensure integrity)
        if (!payos.verifyPaymentWebhookData(data)) {
            throw new Error('Invalid Webhook Signature');
        }

        // 3. Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Check if payment is success (code "00" usually means success in this context structure, 
        // but follow PayOS standard: checking paymentData.desc or similar?)
        // Actually, PayOS webhook sends `code` and `desc`. desc == "success" is common.
        // Let's assume successful webhook means payment is done.

        if (code === "00") {
            const orderCode = paymentData.orderCode;

            // 5. Update Payment Record
            const { data: paymentRecord, error: fetchError } = await supabaseAdmin
                .from('payments')
                .update({ status: 'paid' })
                .eq('order_code', orderCode)
                .select()
                .single();

            if (fetchError || !paymentRecord) {
                console.error("Payment record not found for order:", orderCode);
                throw new Error("Payment record not found");
            }

            // 6. Activate Enrollment
            // Find any existing enrollment for this user in a class belonging to this course
            const { data: classes } = await supabaseAdmin
                .from('classes')
                .select('id')
                .eq('course_id', paymentRecord.course_id);

            if (classes && classes.length > 0) {
                const classIds = classes.map((c: any) => c.id);

                // Upgrade any existing enrollment (e.g. trial) to active
                const { data: updatedEnrollment, error: enrollError } = await supabaseAdmin
                    .from('enrollments')
                    .update({ status: 'active' })
                    .eq('user_id', paymentRecord.user_id)
                    .in('class_id', classIds)
                    .select();

                console.log(`Updated enrollment for user ${paymentRecord.user_id}:`, updatedEnrollment);
            } else {
                console.warn(`No classes found for course ${paymentRecord.course_id}. Cannot auto-enroll.`);
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
