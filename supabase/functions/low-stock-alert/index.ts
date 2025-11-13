import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string | null;
  price: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting low stock alert check...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL');

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products with low stock
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'low_stock_threshold')
      .order('stock_quantity', { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }

    console.log(`Found ${products?.length || 0} low stock products`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: "No low stock products found", count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate HTML email
    const productRows = products.map((product: Product) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px;">${product.name}</td>
        <td style="padding: 12px 16px;">${product.category || 'Uncategorized'}</td>
        <td style="padding: 12px 16px; text-align: center; color: ${product.stock_quantity === 0 ? '#dc2626' : '#f59e0b'}; font-weight: 600;">
          ${product.stock_quantity}
        </td>
        <td style="padding: 12px 16px; text-align: center;">${product.low_stock_threshold || 10}</td>
        <td style="padding: 12px 16px; text-align: right;">KSH ${Number(product.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Low Stock Alert</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ⚠️ Low Stock Alert
              </h1>
              <p style="margin: 8px 0 0 0; color: #e5e7eb; font-size: 16px;">
                Daily Inventory Report - ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>Alert:</strong> You have ${products.length} product${products.length > 1 ? 's' : ''} with low inventory levels. 
                  Review the details below and restock as needed to avoid stockouts.
                </p>
              </div>

              <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">Low Stock Products</h2>
              
              <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Product</th>
                    <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Category</th>
                    <th style="padding: 12px 16px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Current Stock</th>
                    <th style="padding: 12px 16px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Threshold</th>
                    <th style="padding: 12px 16px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>

              <div style="margin-top: 32px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Quick Actions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>Review and update stock levels in your inventory management system</li>
                  <li>Contact suppliers for urgent restocking</li>
                  <li>Consider adjusting low stock thresholds if needed</li>
                  <li>Monitor sales trends to optimize inventory levels</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated daily report from your POS system.
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} Molabs Tech Solutions. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    console.log(`Sending email to ${adminEmail}...`);
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'POS System <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `⚠️ Low Stock Alert - ${products.length} Product${products.length > 1 ? 's' : ''} Need Restocking`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Low stock alert email sent successfully",
        products: products.length,
        emailId: emailResult.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in low-stock-alert function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
