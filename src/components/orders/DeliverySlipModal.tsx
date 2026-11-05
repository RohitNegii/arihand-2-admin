import React, { useRef, useState } from "react";
import {
  X,
  Printer,
  Download,
  FileCode,
  Package,
  Loader2,
  Check
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface DeliverySlipModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliverySlipModal({
  order,
  isOpen,
  onClose
}: DeliverySlipModalProps) {
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);

  if (!isOpen || !order) return null;

  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || {};
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const dispatchDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const totalQuantity =
    order.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1;

  // Destination Routing Code
  const stateCode = (shipping.state || "IN").slice(0, 3).toUpperCase();
  const cityCode = (shipping.city || "HUB").slice(0, 4).toUpperCase();
  const routingHub = `${stateCode}-${cityCode}-${shipping.postalCode || "000000"}`;

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!labelRef.current) return;
    setDownloadingPdf(true);
    try {
      // High resolution capture
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 10000,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");

      // Standard 4" x 6" parcel shipping label is 101.6mm x 152.4mm
      const labelWidthMm = 100;
      const labelHeightMm = (canvas.height * labelWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [labelWidthMm, Math.max(labelHeightMm, 150)]
      });

      pdf.addImage(imgData, "PNG", 0, 0, labelWidthMm, labelHeightMm);
      pdf.save(`Shipping-Label-${order.orderNumber}.pdf`);
      toast.success("Delivery details PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. You can also use 'Print Shipping Label' to save as PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Direct Print Handler
  const handlePrint = () => {
    if (!labelRef.current) return;
    const printContent = labelRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Label #${order.orderNumber}</title>
            <style>
              @page {
                size: 100mm 150mm;
                margin: 2mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #000;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                box-sizing: border-box;
              }
              .label-root {
                width: 96mm;
                margin: 0 auto;
                background: #fff;
                color: #000;
              }
            </style>
          </head>
          <body>
            <div class="label-root">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1200);
      }, 350);
    }
  };

  // Download Offline Standalone HTML Slip
  const handleDownloadHtml = () => {
    if (!labelRef.current) return;
    setDownloadingHtml(true);
    try {
      const labelHtml = labelRef.current.innerHTML;
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipping Label - ${order.orderNumber} - GEETEJ VIRAASAT</title>
  <style>
    @page { size: 100mm 150mm; margin: 3mm; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f4f4f4;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100mm;
      max-width: 100%;
      background: #fff;
      padding: 10px;
      border: 1px solid #ccc;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="no-print" style="margin-bottom: 12px; text-align: center;">
      <button onclick="window.print()" style="padding: 8px 16px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Print Parcel Label
      </button>
    </div>
    <div class="container">
      ${labelHtml}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Parcel-Box-Label-${order.orderNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Offline HTML label downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download HTML slip");
    } finally {
      setDownloadingHtml(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#351E28]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#FDFBF9] rounded-3xl p-5 md:p-7 max-w-2xl w-full border border-[#C8A96A]/30 relative text-left my-4 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#351E28]/10 pb-4 mb-4 gap-3 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-luxury-gold" />
              <h2 className="font-serif text-lg md:text-xl text-[#351E28] font-semibold">
                Parcel Box Delivery Slip
              </h2>
            </div>
            <p className="text-[11px] text-[#351E28]/60 font-sans mt-0.5">
              Amazon-standard shipping & box attachment label for order{" "}
              <strong className="text-[#351E28] font-mono">#{order.orderNumber}</strong>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#351E28]/20 hover:border-[#351E28] text-[#351E28] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Print directly to standard 4x6 label or regular paper"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#351E28] hover:bg-[#2A161F] text-white hover:text-luxury-gold text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              title="Download high-resolution printable PDF label"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadHtml}
              disabled={downloadingHtml}
              className="p-2 rounded-xl bg-white border border-[#351E28]/20 hover:border-[#351E28] text-[#351E28]/70 hover:text-[#351E28] transition-colors cursor-pointer shadow-2xs"
              title="Download standalone HTML label"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#351E28]/5 hover:bg-[#351E28]/15 text-[#351E28]/70 hover:text-[#351E28] transition-all flex items-center justify-center cursor-pointer hover:rotate-90 duration-200"
            aria-label="Close delivery slip modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Label Preview Area */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar py-2 flex justify-center bg-[#EFE9E2]/50 rounded-2xl p-3 sm:p-4 border border-[#351E28]/5">
          {/* THE PHYSICAL LABEL CONTAINER - Sized for standard 4x6" (100x150mm) thermal label or box sticker */}
          <div
            ref={labelRef}
            id="parcel-shipping-label"
            className="w-full max-w-[420px] bg-white text-black p-4 border-2 border-black rounded-sm shadow-md font-sans text-left selection:bg-none"
            style={{ minHeight: "560px" }}
          >
            {/* ROW 1: BRAND LOGO LOCKUP & SERVICE BADGE */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-black text-base sm:text-lg tracking-wider uppercase text-black leading-none">
                    GEETEJ VIRAASAT
                  </span>
                </div>
                <span className="text-[8px] uppercase tracking-[0.2em] font-mono font-bold block mt-0.5 text-gray-800">
                  FINE 92.5 SILVER &bull; EST. 2021
                </span>
                <span className="text-[7.5px] uppercase font-mono text-gray-600 block">
                  Dhule Dispatch Atelier &bull; Maharashtra, India
                </span>
              </div>

              <div className="text-right">
                <span className="inline-block border-2 border-black bg-black text-white px-2 py-0.5 text-[10px] font-mono font-black tracking-wider uppercase">
                  {order.paymentStatus === "Paid" ? "PREPAID" : "EXPRESS ORDER"}
                </span>
                <span className="text-[8px] font-mono font-bold block mt-1 uppercase text-gray-700">
                  Standard Box 1 of 1
                </span>
              </div>
            </div>

            {/* ROW 2: ORDER & ROUTING INFO */}
            <div className="border-b-2 border-black py-2 px-1 bg-gray-50/50 flex justify-between items-center">
              <div>
                <span className="text-[8px] font-mono uppercase text-gray-500 block">Order Identifier</span>
                <span className="font-mono font-black text-sm tracking-wide text-black block">
                  #{order.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono uppercase text-gray-500 block">Dispatch Routing</span>
                <span className="font-mono font-bold text-xs text-black block">
                  {routingHub}
                </span>
              </div>
            </div>

            {/* ROW 3: SHIP TO (CUSTOMER DELIVERY ADDRESS) - PROMINENT AMAZON STYLE */}
            <div className="border-b-2 border-black py-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-mono font-black tracking-widest text-black bg-gray-200 px-1.5 py-0.5 rounded-xs">
                  SHIP TO / DELIVER TO:
                </span>
                <span className="text-[8px] font-mono text-gray-600 font-semibold">
                  Date: {orderDate}
                </span>
              </div>

              <div className="pl-1 space-y-0.5">
                <h3 className="font-bold text-sm sm:text-base text-black uppercase tracking-tight">
                  {shipping.name || order.customer?.name || "Valued Client"}
                </h3>
                <p className="text-[11px] text-gray-900 leading-snug font-medium">
                  {shipping.addressLine1}
                </p>
                {shipping.addressLine2 && (
                  <p className="text-[11px] text-gray-900 leading-snug font-medium">
                    {shipping.addressLine2}
                  </p>
                )}
                <p className="text-[11px] text-gray-900 font-medium">
                  {shipping.city}, {shipping.state}
                </p>

                {/* PROMINENT PIN CODE BOX (AMAZON STYLE) */}
                <div className="pt-1.5 pb-1 flex items-center gap-3">
                  <div className="border-2 border-black bg-black text-white px-3 py-1 font-mono font-black text-sm tracking-wider inline-block">
                    PIN: {shipping.postalCode || "N/A"}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-black">
                    Phone: <span className="text-black font-black">{shipping.phone || "N/A"}</span>
                  </div>
                </div>

                {order.email && (
                  <p className="text-[9px] font-mono text-gray-600 truncate">
                    Email: {order.email}
                  </p>
                )}
              </div>
            </div>

            {/* ROW 4: SOLD BY / SHIPPER RETURN ADDRESS */}
            <div className="border-b-2 border-black py-2 text-[8.5px] leading-relaxed text-gray-800 bg-gray-50/50 px-1">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="font-bold text-black uppercase font-mono">
                  SOLD BY / RETURN ADDRESS (IF UNDELIVERED):
                </span>
                <span className="font-mono text-[7.5px] text-gray-500">
                  GST: 08AAACG1234F1Z5
                </span>
              </div>
              <p className="font-bold text-black uppercase text-[9px]">
                GEETEJ VIRAASAT &bull; ARIHANT JEWELLERS
              </p>
              <p>1848 Arihant Jewellers, Agra Road, Dhule, Maharashtra &ndash; 424001, India</p>
              <p className="font-mono text-[8px] text-gray-700">
                Tel: 02562-238018 &bull; WhatsApp: +91 9494600505 &bull; geetejviraasat@gmail.com
              </p>
            </div>

            {/* ROW 5: ORDER & PARCEL SPECIFICATIONS */}
            <div className="border-b-2 border-black py-2 grid grid-cols-3 gap-2 text-center font-mono text-[9px]">
              <div className="border-r border-black/20 pr-1">
                <span className="text-gray-500 text-[7.5px] uppercase block">Total Value</span>
                <span className="font-bold text-xs text-black">
                  ₹{order.grandTotal?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-r border-black/20 px-1">
                <span className="text-gray-500 text-[7.5px] uppercase block">Box Contents</span>
                <span className="font-bold text-xs text-black">
                  {totalQuantity} {totalQuantity === 1 ? "Piece" : "Pieces"}
                </span>
              </div>
              <div className="pl-1">
                <span className="text-gray-500 text-[7.5px] uppercase block">Material Assurance</span>
                <span className="font-bold text-[9px] text-black">92.5 Silver</span>
              </div>
            </div>

            {/* ROW 6: BOX MANIFEST (ITEM SUMMARY) */}
            <div className="border-b-2 border-black py-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider block text-gray-700 mb-1">
                Box Manifest Items ({order.items?.length || 0}):
              </span>
              <table className="w-full text-left text-[8.5px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-black text-gray-600 text-[7.5px] uppercase">
                    <th className="py-0.5">Item Description</th>
                    <th className="py-0.5 text-center">Purity</th>
                    <th className="py-0.5 text-center">Qty</th>
                    <th className="py-0.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-1 font-medium pr-1">
                        <span className="font-bold text-black block">{item.name}</span>
                        {(item.size || item.variant) && (
                          <span className="text-[7.5px] text-gray-500 block">
                            {[item.size && `Size: ${item.size}`, item.variant && `Opt: ${item.variant}`]
                              .filter(Boolean)
                              .join(" &bull; ")}
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-center font-bold text-black">92.5</td>
                      <td className="py-1 text-center font-bold text-black">{item.quantity}</td>
                      <td className="py-1 text-right font-bold text-black">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BOTTOM PERFORATION LINE GUIDE */}
            <div className="pt-2.5 mt-2 border-t border-dashed border-gray-400 text-center text-[7px] font-mono text-gray-500 uppercase tracking-widest">
              [ FOLD OR AFFIX THIS LABEL FLAT ON PRODUCT SHIPPING BOX ]
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="shrink-0 mt-4 pt-3 border-t border-[#351E28]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-[#351E28]/60 font-sans">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for thermal label printers (4&times;6&quot; / 100&times;150mm) or A4/A6 paper sheets.</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#351E28] hover:text-luxury-gold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
