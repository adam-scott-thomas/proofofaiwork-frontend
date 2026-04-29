import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout moved</DialogTitle>
          <DialogDescription>
            Payments now use the Billing checkout flow.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
