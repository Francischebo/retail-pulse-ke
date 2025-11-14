import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "barcode-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          onScan(decodedText);
          setIsOpen(false);
          html5QrcodeScanner.clear();
        },
        (error) => {
          console.log(error);
        }
      );

      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="ml-2"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div id="barcode-reader" className="w-full"></div>
          <Button variant="outline" onClick={handleClose} className="mt-4">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
