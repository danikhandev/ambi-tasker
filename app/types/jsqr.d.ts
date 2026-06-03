// TypeScript declaration for jsqr library
declare module "jsqr" {
  interface QRCodeResult {
    data: string;
    location?: any;
  }
  function jsQR(data: Uint8ClampedArray, width: number, height: number): QRCodeResult | null;
  export default jsQR;
}
