import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseServer = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  serviceRoleKey || "placeholder-key"
);

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return new Response(JSON.stringify({ error: "Missing signature variables" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
          if (!keySecret) {
            console.error("Razorpay Key Secret is missing!");
            return new Response(JSON.stringify({ error: "Payment verification unavailable" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          // 1. Verify Razorpay Payment Signature using HMAC-SHA256
          const text = `${razorpay_order_id}|${razorpay_payment_id}`;
          const generatedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(text)
            .digest("hex");

          if (generatedSignature !== razorpay_signature) {
            // Update draft to failed if verification fails
            await supabaseServer
              .from("order_drafts")
              .update({ status: "failed", payment_status: "failed" })
              .eq("razorpay_order_id", razorpay_order_id);

            return new Response(JSON.stringify({ error: "Payment signature verification failed" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          // 2. Call verify_and_create_order database transaction RPC
          const { data, error: rpcErr } = await supabaseServer.rpc("verify_and_create_order", {
            p_razorpay_order_id: razorpay_order_id,
            p_razorpay_payment_id: razorpay_payment_id,
            p_razorpay_signature: razorpay_signature
          });

          if (rpcErr) {
            console.error("Order creation RPC transaction failed:", rpcErr);
            return new Response(JSON.stringify({ error: rpcErr.message || "Failed to finalize order transaction" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          // 3. Evaluate transaction response status
          // If status is 'inventory_conflict', the order is NOT created. It will return status: 'inventory_conflict'.
          if (data && data.status === "inventory_conflict") {
            return new Response(JSON.stringify({
              status: "inventory_conflict",
              message: data.message || "Oversold inventory conflict encountered. System flagged for administrator review."
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({
            status: "completed",
            order_number: data.order_number,
            message: "Order verified and processed successfully."
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (err: any) {
          console.error("Verify payment error:", err);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
