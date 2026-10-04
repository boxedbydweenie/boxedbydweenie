import type { SiteImage } from "@/types/images";
import corporate_band from "@/assets/home/corporate-band.webp";
import dispenser_box from "@/assets/home/dispenser-box.webp";
import door_corporate from "@/assets/home/door-corporate.webp";
import door_personal from "@/assets/home/door-personal.webp";
import hero from "@/assets/home/hero.webp";
import lookbook_1 from "@/assets/home/lookbook-1.webp";
import lookbook_2 from "@/assets/home/lookbook-2.webp";
import occ_anniversary from "@/assets/home/occ-anniversary.webp";
import occ_birthday from "@/assets/home/occ-birthday.webp";
import occ_christmas from "@/assets/home/occ-christmas.webp";
import occ_congratulations from "@/assets/home/occ-congratulations.webp";
import occ_get_well from "@/assets/home/occ-get-well.webp";
import occ_new_baby from "@/assets/home/occ-new-baby.webp";
import occ_thank_you from "@/assets/home/occ-thank-you.webp";
import occ_wedding from "@/assets/home/occ-wedding.webp";
import prod_1 from "@/assets/home/prod-1.webp";
import prod_2 from "@/assets/home/prod-2.webp";
import prod_3 from "@/assets/home/prod-3.webp";
import prod_4 from "@/assets/home/prod-4.webp";
import studio from "@/assets/home/studio.webp";

/**
 * Homepage image registry. `temporary: true` marks generated stand-in photography
 * to be swapped for real Boxed by Dweenie photos (keep the same key and aspect ratio).
 */
export const IMAGES = {
  "corporate-band": { src: corporate_band, width: 1100, height: 825, alt: "Rows of black and ivory corporate hampers with gold bows", lqip: "data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAAAQBACdASoUAA8APu1iqU2ppaOiMAgBMB2JYgCdAYvqsLluOLE/kilAsAD+7u523cpk8IQTOE1sinNoYDWCpT9FfjW4evn8tjTFc3XA0tmtpn1qDTsU9JHdrlU6qjW20ZubLWmjbm76AZkfbia1p3gtlRetZGJdqrkryjyqjpUd1B0bgDgzhSToAAA=", temporary: true },
  "dispenser-box": { src: dispenser_box, width: 1024, height: 1024, alt: "Ivory gift box with a gold bow, glowing on black", lqip: "data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAABQBACdASoUABQAPu1krE+ppSQiMBgIATAdiWYAwNwQ77ncgdVF3w/mKGAAAP70G/7g9I6ACaHLoLSxvH077kjz67tN8uAIM4k0StVEwoESsEMc/J3iaKFIcBSES/DCdEK+hPVXcYYMM3eUuDplswGM3lAAAA==", temporary: true },
  "door-corporate": { src: door_corporate, width: 1100, height: 825, alt: "A stack of black corporate gift boxes with gold ribbons", lqip: "data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAAAQBACdASoUAA8APu1iqU2ppaQiMAgBMB2JYwCdACPsxlXJVNp2bVm2gAD+7rENZI5FLdPuTz2mulxAO1cdbVI5ezutckJ51fdVqiwC6qROghjkt3BlNmpUUrVP84t/9q6cX4pEKbCDZEqIQQ6AAA==", temporary: true },
  "door-personal": { src: door_personal, width: 1100, height: 825, alt: "Hands holding a small ivory gift with a gold bow", lqip: "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAADQAwCdASoUAA8APu1iqU2ppaOiMAgBMB2JQBadA9hmFzfKm22qnAAA/uo1VLWzd1pu/Sx+Td/PntwrxZ8xAVV2sgQETQM8kMBZ1WBW/fa9cYimQw3y5jDC/20BFrTp5qJzwAAA", temporary: true },
  "hero": { src: hero, width: 1600, height: 1200, alt: "Black gift box tied with a gold satin bow, lid lifted over ivory tissue", lqip: "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAADQAwCdASoUAA8APu1iqU2ppaOiMAgBMB2JQBWABDetUBTgsJ38mBgA/nxJV4cRRs1QbOcixjoUedgXlMeEouxuUI1CrkEpfMVLkLbYMWcAGKz+pf3FxIEcTF21gUHzciXMC0weOJ3KOfAwAAA=", temporary: true },
  "lookbook-1": { src: lookbook_1, width: 825, height: 1100, alt: "Flat lay of ivory and black gift boxes with gold ribbon", lqip: "data:image/webp;base64,UklGRqAAAABXRUJQVlA4IJQAAABwBACdASoPABQAPu1iqU2ppaOiMAgBMB2JQBOmUAS3ooSbus/QtAINkomdAAD+VPLeWARG0r3wSYqCPdovbQCZ1LBALHmcpZIeD6wyVl2XRMmorCF77vduNzrABWn9gThLwqq7/6HFtgHUyR/0v8P7iBRMgVNXU7Ou+5+Buq+8oXsVYTdz7nx/ZUZT00hi51u/qAAA", temporary: true },
  "lookbook-2": { src: lookbook_2, width: 825, height: 1100, alt: "Festive black hamper with gold baubles and candlelight", lqip: "data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAADwAwCdASoPABQAPu1iqU2ppaOiMAgBMB2JQBOmUABe12ZuDD2QFo9AAP7qMbY5rN++dxnwidKk4pqZJm8fsSxPxc54kp8LkK2HF6G5+7H8uH/6oOEtc2qHgIppSx5qr61E9LX8xzflaju9Xo09VSIuXqVQ284jAUDVFZzNs/k+WIYAAAA=", temporary: true },
  "occ-anniversary": { src: occ_anniversary, width: 768, height: 960, alt: "Black gift box beside champagne glasses and ivory roses", lqip: "data:image/webp;base64,UklGRqQAAABXRUJQVlA4IJgAAABwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JaACdMoBOAhABKDBabyF6qJidAAD+5Ef2JRsRkuFvO6JH4Mlizs42M6hhTFX+GOF7/7ojB+iUu0Tvkl4d3ZA4qPyrg4vFv/6+0bvPFQA3ojA+ythCW9HLxoh+mSWMF4FmmB0HfLG1YUZmYI0iQlHnuhL3t/Mxd78YGZgBzAAAAA==", temporary: true },
  "occ-birthday": { src: occ_birthday, width: 768, height: 960, alt: "Ivory birthday gift with gold bow and a gold candle", lqip: "data:image/webp;base64,UklGRoYAAABXRUJQVlA4IHoAAABQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JagCdMoFWAAUoy/IApy+AGdAAAP7wxor4GB/jMvfy/zcVPluO7Od2K33U9PBRqjAM/f9+575XAAz0TI8Qu36mX1scS1TDKBk8W8KCT6Z/BCTaA4rYsCJF6EJaehwg6LWAAA==", temporary: true },
  "occ-christmas": { src: occ_christmas, width: 768, height: 960, alt: "Black gift box with gold baubles and warm lights", lqip: "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAABQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JagCdAB7HGm8L002FWSrOdG/YAP7prKvpTdgtDDo8lwDitLLt8hyJOJI7SR2hoUmI2RFUx2w5PMnHAD40REmLVLCm2bnBc8KwWSxCbexj9cRoYSdtjpSJhDROXq1GymKheeSqGygKIAAA", temporary: true },
  "occ-congratulations": { src: occ_congratulations, width: 768, height: 960, alt: "Champagne in gold foil inside a black gift box", lqip: "data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAABwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JZgCdMoAluBb0WdpTpWH0LLJBIAD+7sMQ6H4oFTwKZ0yrJ7CxMA53Az7lAkvPvOPNSG3IZCQBrmaOiGW57RwwAgKxw5s/ve4Yd3u0rAU78GfYOsbUQT4W04MRSw8VSj9l8D1mRCU5sq4xjLo+4GAAAAA=", temporary: true },
  "occ-get-well": { src: occ_get_well, width: 768, height: 960, alt: "Get-well box with tea tins, honey, candle and a throw", lqip: "data:image/webp;base64,UklGRoQAAABXRUJQVlA4IHgAAAAwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JYgC7L1ABvdU6xN9nNgEGNwAA/NV94FyGEZWuohIqZDRx/DFNtAstU7HWfP+n5XcamS3hWr1Fg8DNp4dhJ2169AufhDJcaQxBMw98HIo0LmBA6Vui6DSgr/qsgNPIAAA=", temporary: true },
  "occ-new-baby": { src: occ_new_baby, width: 768, height: 960, alt: "Ivory baby gift with knit blanket and tiny shoes", lqip: "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAADQAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JQBOgAlUnNJcbQtbatAAA/oz1IbxWgAGR11SX3+vM1fo+5TwpRngY7OxgBe4lS6TjWo4FZ2pV3ATHo0yJuw6HIDwD8imkSOdlI6UzNwAAAA==", temporary: true },
  "occ-thank-you": { src: occ_thank_you, width: 768, height: 960, alt: "Black gift box with a blank thank-you card and dried flowers", lqip: "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAAAQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JQBOmUABpoCr6pyVtcxoygAD+8qqSCNTWTJFhc3m56T6ENnOdHhDdPwubd97elALCyol4zvB3Lr50FnHDY8IpXRyRcODW8MFNwOh62Q8hHXhlUAA=", temporary: true },
  "occ-wedding": { src: occ_wedding, width: 768, height: 960, alt: "Tall ivory wedding gift box with silk ribbon and gold seal", lqip: "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAADQAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JQBdgA6eO9uHecn1eAuAA/lRp3uyX9Iq2iiNLwGOtf5jqgDQZ4JQU3q0N5ysjNZIPo3esex+tnq9XIa2JSyScRxLN7ZqjFCYCAgAA", temporary: true },
  "prod-1": { src: prod_1, width: 768, height: 960, alt: "Ivory hamper with candles, gold chocolates and a small bottle", lqip: "data:image/webp;base64,UklGRooAAABXRUJQVlA4IH4AAAAQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JaACdMoRwACmwH+ZHXgOtAAD+6o/VJSyOPH3hDNJ13o5+KWBWPVxlnhjW4Us7cpCMG8FNuJl4GC2C+MWJhRfwrrkXZFPg7/NTKeeYuWkjDxozYilyKuzMEuTTw2GgMWRpz3wcAAA=", temporary: true },
  "prod-2": { src: prod_2, width: 768, height: 960, alt: "Black box with a leather wallet, watch and fragrance", lqip: "data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAABwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JYwCdMoADUCo0u5WFuMOUogmQAAD+2E/0RvXY2FLk0nq7G+k8U+f0OiM6zhZzxvY/l2c6DLShuAMFvUNvHNJVpMZmYHiKeuroTbB09c1sVuEpzVx+33LA76EAxG71Ksc1CC0GmCxy5ySp8iQvif3COTL3RPpHL44dUeFYAAA=", temporary: true },
  "prod-3": { src: prod_3, width: 768, height: 960, alt: "Ivory spa box with bath salts, candle and silk eye mask", lqip: "data:image/webp;base64,UklGRqAAAABXRUJQVlA4IJQAAACwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JZgCdMoAlvRl+tbKO07jraon0iMeAAP6wBsww3j31AOtTlgaexefRAI7pvBO3ZihyqC6CFqLNqDBdXjoVGxx3CDKlA8NB+NF93M2ZY5WKbXa2A6G7eng61vTmCiyVsled7Ytw7kHbr9gNKt7Y1bPz2u7gOATTKDGjW+AA", temporary: true },
  "prod-4": { src: prod_4, width: 768, height: 960, alt: "Breakfast box with mugs, coffee, jam and pastries", lqip: "data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAABwBACdASoQABQAPu1iqU2ppaOiMAgBMB2JZgCdAYxY4EY6zR42Q+FTDW8QkAD+x4C9UlnyOwF9PzpzQy5H0ax4GYX9zdWzRhFdwSRFMScy9fZrBCmjY9CC8KV39X8Ry86PjhCRgzjqw3RS3ZFUvw1HDkdXpX7lR7g2dt8P7moV9DMxYVq5nnlwitF83JtIhVpZYZeSUAA=", temporary: true },
  "studio": { src: studio, width: 880, height: 1100, alt: "Packing table in the studio with black and ivory boxes and gold ribbon", lqip: "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAAAQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JQBWABH//ORbRknyRZzm9AAD+7yF2h/ZB7opWLIANEo1JRflCCk2MkzbRth7CJbcntmQjVAgbivSTvsx6X9S8DJIXepIQXoOZIycc9JxJFdtVK9EC1LpzyBJovDQj1ARk5o9NwHimAAAA", temporary: true },
} satisfies Record<string, SiteImage>;

export type ImageKey = keyof typeof IMAGES;
