export const WHATSAPP_NUMBER = "919121744996";

export const waLink = (message, number = WHATSAPP_NUMBER) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const waLinkTo = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
