// import { NextResponse } from "next/server";
// import Razorpay from "razorpay";

// export const runtime = 'edge';

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_LIVE_KEY_ID as string,
//     key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET
// })


// export async function POST(req:Request) {
//     const razorpay = new Razorpay({
//     key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
//     key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET
// })
//     const {amount}:{amount:any} = await req.json();
//     const order = await razorpay.orders.create({
//         amount,
//         currency:"INR",
//     });
    

//     return NextResponse.json(order);

// }

import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    console.log("Creating Razorpay instance...");
    console.log("Razorpay Key ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET,
    });

    const body = await req.json() as { amount: number };
    const { amount } = body;

    console.log("Request amount:", amount);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
    });

    console.log("Order created:", order);

    return NextResponse.json(order);

  } catch (error: any) {
    console.error("Error creating order:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to create order", detail: error?.message || error },
      { status: 500 }
    );
  }
}
