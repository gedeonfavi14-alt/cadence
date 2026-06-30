import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function QRCodePage() {
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef(null);

  // The permanent URL to the customer menu
  const menuUrl = `${window.location.origin}/menu/${restaurant?.id}`;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Code_${restaurant?.name || 'Menu'}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printQR = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-8 print:hidden">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Code QR du Menu</h1>
      </div>

      <div className="flex flex-col items-center justify-center p-6 text-center print:p-0">
        <p className="text-text-secondary mb-8 print:hidden">
          Imprimez ce QR Code et placez-le sur vos tables. Vos clients pourront scanner et commander directement.
        </p>

        {/* Printable Area */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 mb-8 max-w-sm w-full print:shadow-none print:border-none print:max-w-none">
          <div className="mb-6">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-16 h-16 mx-auto rounded-full object-cover mb-3" />
            ) : (
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-3">🍽️</div>
            )}
            <h2 className="text-2xl font-bold text-black uppercase tracking-wider">{restaurant?.name}</h2>
            <p className="text-gray-500 text-sm mt-1">Scannez pour voir le menu</p>
          </div>

          <div ref={qrRef} className="bg-white p-4 rounded-xl inline-block border-2 border-gray-100">
            <QRCodeSVG 
              value={menuUrl}
              size={220}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              imageSettings={
                restaurant?.logo_url ? {
                  src: restaurant.logo_url,
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                } : undefined
              }
            />
          </div>
          
          <div className="mt-6 font-bold text-olive text-lg">CADENCE</div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full max-w-sm print:hidden">
          <button 
            onClick={downloadQR}
            className="flex-1 btn btn-secondary flex-col gap-2 py-4 h-auto"
          >
            <Download size={24} />
            <span>Télécharger</span>
          </button>
          <button 
            onClick={printQR}
            className="flex-1 btn btn-primary flex-col gap-2 py-4 h-auto"
          >
            <Printer size={24} />
            <span>Imprimer</span>
          </button>
        </div>
        
        <div className="mt-8 text-xs text-text-muted break-all px-4 print:hidden">
          Lien direct : {menuUrl}
        </div>
      </div>

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .app-layout {
            display: block !important;
          }
          .bottom-nav {
            display: none !important;
          }
          .app-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white {
            background-color: white !important;
          }
          .text-black {
            color: black !important;
          }
          .text-gray-500 {
            color: #6b7280 !important;
          }
          /* Make the printable area visible */
          div[ref] {
             visibility: visible;
          }
          .max-w-sm {
            visibility: visible;
          }
          .max-w-sm * {
            visibility: visible;
          }
          .max-w-sm {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100% !important;
          }
        }
      `}} />
    </div>
  );
}
