import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import PayOS from "npm:@payos/node";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { courseId, returnUrl, cancelUrl } = await req.json()

        // 1. Initialize PayOS
        const payos = new PayOS(
            Deno.env.get('PAYOS_CLIENT_ID')!,
            Deno.env.get('PAYOS_API_KEY')!,
            Deno.env.get('PAYOS_CHECKSUM_KEY')!
        );

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Get User from Auth Header
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // 4. Get Course Details
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()

        if (courseError || !course) throw new Error('Course not found')
        if (course.price <= 0) throw new Error('Course is free')

        // 5. Generate Order Code (Must be unique int within range)
        // Simple strategy: timestamp + random 3 digits (careful with max safe integer)
        // Max safe integer is 9007199254740991. Timestamp is ~1700000000000.
        const orderCode = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString());

        // 6. Create Payment Link Request
        const paymentData = {
            orderCode: orderCode,
            amount: course.price,
            description: `Thanh toan khoa hoc ${course.title || 'Japanese'}`,
            items: [
                {
                    name: course.title || 'Course Access',
                    quantity: 1,
                    price: course.price
                }
            ],
            returnUrl: returnUrl || 'http://localhost:5173/payment/success',
            cancelUrl: cancelUrl || 'http://localhost:5173/payment/cancel'
        };

        const paymentLinkRes = await payos.createPaymentLink(paymentData);

        // 7. Save pending transaction to database
        const { error: dbError } = await supabaseAdmin
            .from('payments')
            .insert({
                user_id: user.id,
                course_id: course.id,
                order_code: orderCode,
                amount: course.price,
                status: 'pending',
                checkout_url: paymentLinkRes.checkoutUrl
            })

        if (dbError) throw dbError

        return new Response(
            JSON.stringify(paymentLinkRes),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
