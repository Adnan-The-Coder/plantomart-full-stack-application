"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function ContactButtons() {
  return (
    <div className="contact-stack" role="group" aria-label="Contact actions">
      <Link
        href="https://wa.me/918331801000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="contact-button whatsapp-button"
      >
        <Image
          src="/assets/whatsapp.png"
          alt="WhatsApp"
          width={34}
          height={34}
          className="contact-icon"
          sizes="32px"
          priority
        />
      </Link>
    </div>
  );
}
