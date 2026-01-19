import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify PayOS webhook signature
async function verifyWebhookSignature(data: any, checksumKey: string): Promise<boolean> {
    try {
        const { signature, ...paymentData } = data;
        if (!signature) return false;

        // Sort keys and create string to sign
        const sortedData = Object.keys(paymentData.data || {})
            .sort()
            .map(key => `${key}=${paymentData.data[key]}`)
            .join('&');

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(checksumKey),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(sortedData));
        const computedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return computedSignature === signature;
    } catch (e) {
        console.error('Signature verification error:', e);
        return false;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const webhookData = await req.json()
        console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

        const { code, desc, data: paymentData, signature } = webhookData;

        // 1. Get checksum key
        const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');
        if (!checksumKey) {
            throw new Error('PAYOS_CHECKSUM_KEY not configured');
        }

        // 2. Verify signature (optional but recommended)
        // const isValid = await verifyWebhookSignature(webhookData, checksumKey);
        // if (!isValid) {
        //     throw new Error('Invalid Webhook Signature');
        // }

        // 3. Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Check if payment is success
        if (code === "00" && paymentData) {
            const orderCode = paymentData.orderCode;
            console.log('Processing successful payment for order:', orderCode);

            // 5. Update Payment Record -> 'paid'
            const { data: paymentRecord, error: fetchError } = await supabaseAdmin
                .from('payments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('order_code', orderCode)
                .select('*, courses(*)')
                .single();

            if (fetchError || !paymentRecord) {
                console.error("Payment record not found for order:", orderCode, fetchError);
            } else {
                console.log('Payment updated:', paymentRecord);

                // 6. Create User Course Access
                const { error: accessError } = await supabaseAdmin
                    .from('user_courses')
                    .upsert({
                        user_id: paymentRecord.user_id,
                        course_id: paymentRecord.course_id,
                        purchased_at: new Date().toISOString(),
                        payment_id: paymentRecord.id,
                        status: 'active'
                    }, {
                        onConflict: 'user_id,course_id'
                    });

                if (accessError) {
                    console.error('Error creating user_courses access:', accessError);
                } else {
                    console.log('User course access granted');
                }
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
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    }
})
