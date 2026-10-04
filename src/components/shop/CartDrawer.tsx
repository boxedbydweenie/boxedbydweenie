import { Link } from "@tanstack/react-router";
import { Button, EmptyState } from "@/components/site/Brand";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { openCart, useCart, useUi } from "@/hooks/use-shop";
import { cartCount } from "@/services/cart";
import { CartLine, SummaryRows } from "./CartParts";

export function CartDrawer() {
  const { cart: open } = useUi();
  const items = useCart();
  const close = () => openCart(false);
  return <Sheet open={open} onOpenChange={openCart}>
    <SheetContent side="right" className="flex w-full flex-col bg-paper p-0 sm:max-w-md">
      <div className="border-b border-border px-6 py-5">
        <SheetTitle className="text-lg">Your bag</SheetTitle>
        <SheetDescription className="text-xs">{cartCount(items)} {cartCount(items) === 1 ? "item" : "items"}</SheetDescription>
      </div>
      {items.length === 0
        ? <div className="flex-1 p-6"><EmptyState line="Your bag is empty. Let us find something worth a wow." action={<Button asChild onClick={close}><Link to="/shop">Shop gifts</Link></Button>} /></div>
        : <>
          <ul className="flex-1 overflow-y-auto px-6">{items.map((i) => <CartLine key={i.key} item={i} compact />)}</ul>
          <div className="border-t border-border bg-ivory px-6 py-5">
            <SummaryRows items={items} />
            <div className="mt-5 grid gap-2">
              <Button asChild size="lg" onClick={close}><Link to="/checkout">Checkout</Link></Button>
              <Button asChild variant="outline" onClick={close}><Link to="/cart">View bag</Link></Button>
              <Button variant="ghost" onClick={close}>Keep shopping</Button>
            </div>
          </div>
        </>}
    </SheetContent>
  </Sheet>;
}
