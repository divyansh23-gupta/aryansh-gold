import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseServer = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  serviceRoleKey || "placeholder-key"
);

export const Route = createFileRoute("/api/create-payment-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { cartItems, customerName, customerEmail, customerPhone, shippingAddress, billingAddress, notes, userId } = await request.json();

          if (!cartItems || cartItems.length === 0) {
            return new Response(JSON.stringify({ error: "Cart is empty" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          // 1. Verify variant stock and compute totals from Database
          const variantIds = cartItems.map((item: any) => item.variant_id);
          const { data: dbVariants, error: variantErr } = await supabaseServer
            .from("product_variants")
            .select("id, stock_quantity, price, status")
            .in("id", variantIds);

          if (variantErr || !dbVariants) {
            return new Response(JSON.stringify({ error: "Failed to load variants" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const variantMap = new Map(dbVariants.map(v => [v.id, v]));
          let subtotal = 0;

          for (const item of cartItems) {
            const dbVar = variantMap.get(item.variant_id);
            if (!dbVar) {
              return new Response(JSON.stringify({ error: `Variant ${item.variant_id} not found` }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }

            if (dbVar.status !== "active") {
              return new Response(JSON.stringify({ error: `Variant ${item.variant_id} is inactive` }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }

            if (dbVar.stock_quantity < item.quantity) {
              return new Response(JSON.stringify({ error: "Insufficient stock for some items" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }

            subtotal += Number(dbVar.price) * item.quantity;
          }

          const shippingCost = 0;
          const totalAmount = subtotal;
          const amountInPaise = Math.round(totalAmount * 100);

          // 2. Call Razorpay API to generate order
          const keyId = process.env.VITE_RAZORPAY_KEY_ID || "";
          const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

          if (!keyId || !keySecret) {
            console.error("Razorpay API credentials missing in server environment!");
            return new Response(JSON.stringify({ error: "Payment gateway credentials not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const receiptId = `rcpt_${crypto.randomUUID().slice(0, 18)}`;
          
          const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
            },
            body: JSON.stringify({
              amount: amountInPaise,
              currency: "INR",
              receipt: receiptId
            })
          });

          if (!rpRes.ok) {
            const rpError = await rpRes.text();
            console.error("Razorpay Orders API failed:", rpError);
            return new Response(JSON.stringify({ error: "Failed to initiate payment with Razorpay" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const rpOrder = await rpRes.json();

          // 3. Save order details inside order_drafts table
          const { error: draftErr } = await supabaseServer
            .from("order_drafts")
            .insert({
              user_id: userId || null,
              razorpay_order_id: rpOrder.id,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone || null,
              shipping_address: shippingAddress,
              billing_address: billingAddress || null,
              cart_items: cartItems,
              subtotal,
              shipping_cost: shippingCost,
              total_amount: totalAmount,
              status: "pending",
              payment_status: "pending"
            });

          if (draftErr) {
            console.error("Failed to insert order draft:", draftErr);
            return new Response(JSON.stringify({ error: "Failed to persist transaction details" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({
            razorpay_order_id: rpOrder.id,
            amount: amountInPaise,
            currency: "INR",
            key_id: keyId
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (err: any) {
          console.error("Create payment order error:", err);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
