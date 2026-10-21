// Homepage built from the approved concept (October 2026). Styles live in src/styles/home.css, scoped to .bbd-home.
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import type React from "react";
import { useHomeMotion } from "./useHomeMotion";

export function ConceptHome() {
  const root = useRef<HTMLDivElement>(null);
  useHomeMotion(root);
  return <div ref={root} className="bbd-home">

<section className="hero" aria-label="Introduction">
  <div className="rib rib-v" aria-hidden="true"></div>
  <div className="rib rib-h" aria-hidden="true"></div>
  <svg className="bowmark bow-load" viewBox="0 0 645 540" aria-hidden="true"><defs><linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F2D57E" /><stop offset=".45" stopColor="#E7B93B" /><stop offset="1" stopColor="#B98A1C" /></linearGradient></defs><g transform="translate(-1115 -340)" fill="url(#gilt)"><g className="b-tailL"><path d="M1404.2 545.7C1404.2 545.7 1404.9 545.8 1405.3 545.8C1347.7 648.1 1237.5 837.4 1205.5 868.0L1205.5 761.1L1150.8 767.4L1253.5 608.1C1304.1 587.5 1360.9 563.0 1401.0 545.3C1402.2 545.4 1403.2 545.6 1404.2 545.7" /></g><g className="b-tailR"><path d="M1625.2 598.7L1734.0 767.4L1679.3 761.1L1679.3 868.0C1645.9 836.1 1528.4 633.4 1479.7 546.6C1481.4 547.9 1483.4 548.8 1485.8 548.8C1486.5 548.9 1487.3 548.9 1488.0 548.9C1490.5 548.9 1493.0 548.8 1495.4 548.6C1523.4 564.3 1563.7 584.2 1594.3 591.4C1601.8 593.1 1612.7 595.7 1625.2 598.7" /></g><g className="b-loopL"><path d="M1252.2 604.4C1210.8 621.3 1173.9 635.3 1155.9 639.8C1153.8 640.4 1151.6 639.2 1150.7 637.1C1139.5 611.6 1126.1 570.3 1125.0 538.2C1124.9 536.0 1126.3 534.0 1128.4 533.5C1155.7 525.6 1207.2 513.0 1254.7 508.5C1289.2 519.1 1324.2 529.3 1352.5 536.5C1353.4 536.7 1354.1 537.0 1355.0 537.2C1355.7 537.4 1356.6 537.5 1357.3 537.7C1370.4 541.0 1381.8 543.4 1391.0 544.9C1356.4 560.3 1307.1 581.8 1263.7 599.7C1261.1 600.7 1258.5 601.8 1255.8 602.9C1255.2 603.1 1254.7 603.4 1254.0 603.6C1253.4 603.9 1252.8 604.1 1252.2 604.4" /><path d="M1130.4 460.8L1130.4 460.0C1132.9 433.4 1148.0 389.5 1161.3 357.1C1162.5 353.9 1165.6 351.9 1169.0 351.9C1169.7 351.9 1170.4 352.0 1171.0 352.2C1282.7 378.9 1370.5 431.8 1404.9 458.7C1405.1 458.9 1405.3 459.1 1405.5 459.3C1403.9 460.8 1403.0 462.8 1403.0 465.0L1401.9 525.1L1401.7 534.9C1401.7 537.1 1402.5 539.4 1404.3 541.0C1404.0 541.3 1403.6 541.5 1403.2 541.7C1402.5 542.0 1401.6 542.4 1400.7 542.8C1391.5 541.5 1379.7 539.0 1366.1 535.7C1365.3 535.5 1364.4 535.4 1363.5 535.2C1362.7 535.0 1361.8 534.8 1361.0 534.5C1331.8 527.2 1295.2 516.5 1258.5 505.5C1257.5 505.2 1256.4 504.8 1255.4 504.5C1254.4 504.2 1253.4 503.9 1252.5 503.6C1235.4 498.5 1218.4 493.2 1202.3 488.3C1177.8 480.7 1154.7 473.6 1136.3 468.1C1132.7 467.1 1130.4 464.2 1130.4 460.8" /></g><g className="b-loopR"><path d="M1747.9 516.5C1742.9 535.7 1740.1 566.2 1737.9 590.8C1736.5 605.9 1735.2 621.4 1733.8 625.0C1728.3 620.4 1695.4 611.2 1626.7 594.8C1626.2 594.6 1625.7 594.6 1625.1 594.5C1624.6 594.3 1624.1 594.2 1623.6 594.1C1615.0 592.0 1605.9 589.9 1596.3 587.7C1568.5 581.1 1532.2 563.5 1505.8 548.9C1515.0 548.1 1524.9 546.5 1535.5 544.1C1536.5 543.9 1537.6 543.8 1538.5 543.5C1539.5 543.3 1540.4 543.0 1541.4 542.8C1585.5 532.3 1638.4 511.5 1680.2 493.3C1701.5 497.7 1725.5 504.1 1744.3 509.9C1746.9 510.7 1748.5 513.5 1747.8 516.5L1747.9 516.5" /><path d="M1485.8 546.5C1483.1 546.5 1480.9 545.0 1479.5 542.8C1479.7 542.7 1479.8 542.6 1479.9 542.5C1480.6 541.9 1481.1 541.3 1481.5 540.6C1481.7 540.2 1481.9 539.9 1482.1 539.5C1482.1 539.1 1482.3 538.7 1482.4 538.3C1482.6 537.7 1482.6 537.2 1482.6 536.6L1482.6 463.7C1482.6 461.9 1482.1 460.2 1481.0 458.9C1481.1 458.7 1481.3 458.6 1481.4 458.5C1492.1 450.7 1517.1 433.2 1553.9 413.1C1590.7 393.0 1639.0 370.1 1696.3 351.4C1697.2 351.1 1698.1 351.0 1699.0 351.0C1702.3 351.0 1705.4 352.9 1706.8 356.1L1747.1 449.2C1748.9 453.5 1747.1 458.4 1743.0 460.3C1729.5 466.6 1708.1 476.6 1682.8 487.6C1682.2 487.8 1681.6 488.1 1681.0 488.4C1680.4 488.7 1679.7 489.0 1679.0 489.3C1633.8 508.7 1577.1 530.9 1531.0 541.0C1529.9 541.2 1528.8 541.5 1527.9 541.7C1526.7 541.9 1525.6 542.2 1524.4 542.4C1514.4 544.4 1504.9 545.7 1496.2 546.3C1495.4 546.3 1494.7 546.4 1494.0 546.4C1493.2 546.5 1492.5 546.5 1491.7 546.5C1490.5 546.5 1489.3 546.6 1488.2 546.6C1487.4 546.6 1486.6 546.6 1485.9 546.5L1485.8 546.5" /></g><g className="b-knot"><path d="M1476.9 536.6C1476.9 536.6 1476.4 537.4 1476.0 537.8L1475.9 537.8C1475.9 537.8 1475.3 538.3 1475.1 538.5C1474.9 538.5 1474.6 538.6 1474.4 538.7C1474.3 538.8 1474.1 538.9 1474.0 538.9C1473.9 538.9 1473.6 538.9 1473.4 539.1C1473.0 539.2 1472.6 539.2 1472.2 539.2C1472.0 539.2 1471.9 539.2 1471.7 539.1C1466.0 538.4 1450.6 536.6 1435.0 536.6C1428.4 536.6 1421.9 536.9 1415.9 537.8C1415.4 537.8 1415.0 537.8 1414.5 538.0C1414.2 538.0 1413.9 538.1 1413.7 538.1C1413.5 538.2 1413.2 538.2 1412.9 538.2L1412.6 538.2C1412.6 538.2 1411.9 538.1 1411.4 538.1C1411.1 538.0 1410.8 537.9 1410.4 537.7C1410.4 537.7 1410.3 537.7 1410.2 537.6C1409.9 537.5 1409.5 537.3 1409.2 537.2C1409.0 537.0 1408.8 536.8 1408.6 536.7C1408.5 536.7 1408.4 536.5 1408.4 536.4C1407.3 535.4 1406.6 534.0 1406.6 532.5L1406.6 526.7L1406.8 525.4L1406.8 522.8L1407.9 467.4C1407.9 466.1 1408.5 464.9 1409.4 463.9C1409.5 463.7 1409.7 463.5 1409.9 463.4C1410.1 463.4 1410.2 463.2 1410.2 463.1C1410.5 462.9 1410.9 462.7 1411.3 462.6C1412.4 462.1 1413.7 461.9 1414.9 462.2C1422.1 463.6 1431.1 464.5 1440.3 464.5C1450.4 464.5 1460.7 463.5 1469.4 460.8C1471.4 460.2 1473.6 460.5 1475.2 461.7C1475.2 461.7 1475.2 461.8 1475.2 461.8C1475.2 461.8 1475.7 462.3 1476.0 462.5C1476.3 462.7 1476.4 463.0 1476.6 463.4C1477.2 464.2 1477.5 465.1 1477.5 466.2L1477.5 534.4C1477.5 534.9 1477.4 535.2 1477.3 535.6C1477.1 536.0 1477.0 536.3 1476.8 536.6L1476.9 536.6" /></g></g></svg>
  <div className="wrap">
    <div className="hero-copy">
      <p className="eyebrow" style={{color:"var(--gold-text)"} as React.CSSProperties}>Luxury gifts &amp; packaging · Lagos</p>
      <h1 style={{marginTop:"18px"} as React.CSSProperties}>Moments, <span className="script">boxed.</span></h1>
      <p className="lede">We curate, wrap and deliver gifts people keep talking about. For the ones you love, and the people who keep your business running.</p>
      <div className="ctas">
        <Link className="btn btn-ink" to="/shop">Shop gifts <span className="arr">→</span></Link>
        <Link className="btn btn-line" to="/corporate">Corporate gifting</Link>
      </div>
      <div className="proof"><div><strong>5,000+</strong>boxes delivered</div><div><strong>450+</strong>happy clients</div><div><strong>2021</strong>gifting since</div></div>
    </div>
    <div className="bow-stage" aria-hidden="true"></div>
  </div>
</section>

<section className="note pad" aria-labelledby="note-title">
  <div className="wrap note-grid">
    <div className="rv">
      <p className="eyebrow" style={{color:"var(--gold-text)"} as React.CSSProperties}>Before you begin</p>
      <h2 id="note-title" style={{marginTop:"14px"} as React.CSSProperties}><em>A Note from the Team</em></h2>
      <img className="mark" src="/home/bow-gold.svg" alt="" />
    </div>
    <div className="letter rv">
      <p>Every gift on this site was chosen with one question in mind: <em>what would make the recipient feel valued and appreciated?</em></p>
      <p>Inside, you’ll find thoughtfully curated gifts for clients, teams, loved ones and special moments. Choose one as it is, or let us tailor something around your budget, purpose or brand.</p>
      <div className="sign">With warmth,<span className="script">The Boxed by Dweenie Team</span></div>
    </div>
  </div>
</section>

<div className="marquee" aria-hidden="true"><div className="track" id="mq">
  <span>Birthdays</span><span className="script">for her</span><span>Year-end staff gifts</span><span className="script">for him</span><span>Weddings</span><span className="script">with love</span><span>New babies</span><span className="script">thank you</span><span>Onboarding kits</span><span className="script">cheers</span><span>Christmas</span>

  <span aria-hidden="true">Birthdays</span><span aria-hidden="true" className="script">for her</span><span aria-hidden="true">Year-end staff gifts</span><span aria-hidden="true" className="script">for him</span><span aria-hidden="true">Weddings</span><span aria-hidden="true" className="script">with love</span><span aria-hidden="true">New babies</span><span aria-hidden="true" className="script">thank you</span><span aria-hidden="true">Onboarding kits</span><span aria-hidden="true" className="script">cheers</span><span aria-hidden="true">Christmas</span>
</div></div>

<section className="pad" id="shop">
  <div className="wrap">
    <div className="head rv"><h2><span className="script">Three</span> ways to gift</h2><p>Pick a ready-made box, brand one for your company, or let us choose for you in under a minute.</p></div>
    <div className="ways rv">
      <Link className="way shop" to="/shop"><img src="/home/p02.jpg" alt="" /><span className="verb">shop</span><h3>Ready-made gifts</h3><p>Curated boxes for every occasion, wrapped and ready for delivery.</p><span className="more">Browse the shop →</span></Link>
      <Link className="way corp" to="/corporate"><img src="/home/p05.jpg" alt="" /><span className="verb">brand</span><h3>Corporate gifting</h3><p>Your logo, your message, from ten boxes to a thousand. Quote in 24 hours.</p><span className="more">Get a quote →</span></Link>
      <Link className="way disp" to="/dispenser"><img src="/home/p20.jpg" alt="" /><span className="verb">dispense</span><h3>Gift in 60 seconds</h3><p>Three quick questions and our Gift Dispenser picks the right box.</p><span className="more">Try the dispenser →</span></Link>
    </div>
  </div>
</section>

<section className="pad" style={{paddingTop:"0"} as React.CSSProperties} id="rail">
  <div className="wrap">
    <div className="head rv"><h2><span className="script">The</span> 2026 editions</h2><div className="rail-ctl"><button className="round" id="prev" aria-label="Previous gifts">←</button><button className="round" id="next" aria-label="Next gifts">→</button></div></div>
    <div className="rail rv" id="railEl">
      <Link className="prod" to="/shop/$slug" params={{ slug: "corporate-edition" }}><div className="ph"><img src="/home/p01.jpg" alt="Corporate Edition" /><span className="badge" style={{background:"var(--navy)"} as React.CSSProperties}>For teams</span></div><div className="meta"><h3>Corporate Edition</h3><span className="price">₦350,000</span></div><p className="box">Wooden trunk · speaker, laptop stand, treats</p></Link>
      <Link className="prod" to="/shop/$slug" params={{ slug: "abundance-edition" }}><div className="ph"><img src="/home/p02.jpg" alt="Abundance Edition" /><span className="badge" style={{background:"var(--forest)"} as React.CSSProperties}>For families</span></div><div className="meta"><h3>Abundance Edition</h3><span className="price">₦350,000</span></div><p className="box">Wooden trunk · a full pantry, carried home</p></Link>
      <Link className="prod" to="/shop/$slug" params={{ slug: "executive-edition" }}><div className="ph"><img src="/home/p05.jpg" alt="Executive Edition" /><span className="badge" style={{background:"var(--ink)"} as React.CSSProperties}>For leaders</span></div><div className="meta"><h3>Executive Edition</h3><span className="price">₦500,000</span></div><p className="box">Acrylic box · power bank, lamp, Prosecco</p></Link>
      <Link className="prod" to="/shop/$slug" params={{ slug: "the-home-edition" }}><div className="ph"><img src="/home/p06.jpg" alt="The Home Edition" /><span className="badge" style={{background:"var(--oxblood)"} as React.CSSProperties}>For the home</span></div><div className="meta"><h3>The Home Edition</h3><span className="price">₦500,000</span></div><p className="box">Acrylic box · silk sheets, robe, candle</p></Link>
      <Link className="prod" to="/shop/$slug" params={{ slug: "prestige-collection" }}><div className="ph"><img src="/home/p09.jpg" alt="Prestige Collection" /><span className="badge" style={{background:"var(--beige)"} as React.CSSProperties}>Most generous</span></div><div className="meta"><h3>Prestige Collection</h3><span className="price">₦650,000</span></div><p className="box">Acrylic box · Adire, grill, whiskey</p></Link>
      <Link className="prod" to="/shop/$slug" params={{ slug: "signature-collection" }}><div className="ph"><img src="/home/p10.jpg" alt="Signature Collection" /><span className="badge" style={{background:"var(--plum)"} as React.CSSProperties}>In your colours</span></div><div className="meta"><h3>Signature Collection</h3><span className="price">₦850,000</span></div><p className="box">Colour-themed · Rituals, Harrods, Belvoir</p></Link>
    </div>
  </div>
</section>

<section className="unbox" id="unbox" aria-label="How it works">
  <div className="pin">
    <div>
      <p className="eyebrow" style={{color:"var(--gold)"} as React.CSSProperties}>How it works</p>
      <h2 style={{marginTop:"16px"} as React.CSSProperties}>From your brief to <span className="script">their wow</span></h2>
      <ol className="steps" id="steps">
        <li className="on cur"><span className="n">1</span><div><b>Choose</b><span>Pick a box, or tell us your budget and who it is for.</span></div></li>
        <li><span className="n">2</span><div><b>Personalise</b><span>Add a note, their name, or your company logo.</span></div></li>
        <li><span className="n">3</span><div><b>We box it</b><span>Every gift is arranged, wrapped and checked by hand.</span></div></li>
        <li><span className="n">4</span><div><b>Delivered</b><span>Anywhere in Nigeria, on the day that matters.</span></div></li>
      </ol>
    </div>
    <div className="scene" aria-hidden="true">
      <div className="giftbox" id="giftbox">
        <div className="item" style={{"--dx":"-190px","--dy":"-120px","--r":"-14deg"} as React.CSSProperties}><img src="/home/p18.jpg" alt="" /></div>
        <div className="item" style={{"--dx":"190px","--dy":"-150px","--r":"12deg"} as React.CSSProperties}><img src="/home/p14.jpg" alt="" /></div>
        <div className="item" style={{"--dx":"10px","--dy":"-260px","--r":"-3deg"} as React.CSSProperties}><img src="/home/p16.jpg" alt="" /></div>
        <div className="base"></div>
        <div className="lid"><img src="/home/bow-gold.svg" alt="" /></div>
      </div>
    </div>
    <div className="ub-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </div>
</section>

<section className="pad occ-sec" id="occasions">
  <div className="wrap">
    <div className="head rv"><h2><span className="script">For</span> every occasion</h2><p>From birthdays to boardrooms, there is a box for the moment you are marking.</p></div>
    <div className="occ rv">
      <Link className="o light" style={{"--c":"var(--coral)"} as React.CSSProperties} to="/shop" search={{ occasion: "birthday" }}><div className="ph"><img src="/home/p17.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Birthdays</h3><span className="sub">Make their day</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--oxblood)"} as React.CSSProperties} to="/shop" search={{ occasion: "anniversary" }}><div className="ph"><img src="/home/p18.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Anniversaries</h3><span className="sub">Years worth celebrating</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o light" style={{"--c":"var(--sage)"} as React.CSSProperties} to="/shop" search={{ occasion: "new-baby" }}><div className="ph"><img src="/home/p19.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>New baby</h3><span className="sub">For the new arrival</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--plum)"} as React.CSSProperties} to="/shop" search={{ occasion: "wedding" }}><div className="ph"><img src="/home/p07.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Weddings</h3><span className="sub">For the happy couple</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--beige)"} as React.CSSProperties} to="/shop" search={{ occasion: "thank-you" }}><div className="ph"><img src="/home/p20.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Thank you</h3><span className="sub">Gratitude, boxed</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--navy)"} as React.CSSProperties} to="/corporate"><div className="ph"><img src="/home/p14.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Onboarding</h3><span className="sub">A warm first day</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--forest)"} as React.CSSProperties} to="/shop" search={{ occasion: "christmas" }}><div className="ph"><img src="/home/p13.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Christmas</h3><span className="sub">The festive edit</span><span className="go" aria-hidden="true">→</span></div></Link>
      <Link className="o" style={{"--c":"var(--ink)"} as React.CSSProperties} to="/shop"><div className="ph"><img src="/home/p12.jpg" alt="" loading="lazy" /></div><div className="lbl"><h3>Just because</h3><span className="sub">No reason needed</span><span className="go" aria-hidden="true">→</span></div></Link>
    </div>
  </div>
</section>

<section className="corp-band pad" id="corporate">
  <div className="wrap corp-grid">
    <div className="rv">
      <p className="eyebrow" style={{color:"var(--gold)"} as React.CSSProperties}>Corporate gifting</p>
      <h2 style={{marginTop:"16px"} as React.CSSProperties}>Gifts that carry <span className="script">your name</span></h2>
      <p className="lede">Staff rewards, client thank-yous and event souvenirs, branded with your logo and delivered to one office or a hundred addresses.</p>
      <div className="uses"><span>Year-end staff gifts</span><span>Client appreciation</span><span>Onboarding kits</span><span>Event souvenirs</span></div>
      <div className="ctas" style={{display:"flex",flexWrap:"wrap",gap:"12px",marginTop:"30px"} as React.CSSProperties}><Link className="btn btn-gold" to="/corporate/quote">Get an instant quote <span className="arr">→</span></Link><Link className="btn btn-line" to="/contact">Book a call</Link></div>
    </div>
    <div className="stats rv">
      <div className="stat"><b data-count="5000" data-suffix="+">5,000+</b><span>boxes delivered</span></div>
      <div className="stat"><b data-count="450" data-suffix="+">450+</b><span>clients served</span></div>
      <div className="stat"><b>24h</b><span>to a priced quote</span></div>
      <div className="stat"><b>20 Nov</b><span>order-by date for Christmas</span></div>
    </div>
  </div>
</section>

<div className="logos" aria-label="Some of our clients">
  <p className="eyebrow">Trusted by</p>
  <div className="track"><img src="/home/clients-strip.png" alt="Client logos including Transcorp, FBNQuest, Sterling, Workforce and Loanbox" /><img src="/home/clients-strip.png" alt="" /></div>
</div>

<section className="quotes pad">
  <div className="wrap q-wrap">
    <div className="rv"><h2><span className="script">Kind</span> words</h2><p style={{marginTop:"18px",color:"var(--ink-soft)",maxWidth:"34ch"} as React.CSSProperties}>What people say after the box is opened.</p><div className="q-ctl" id="qctl"></div></div>
    <div className="q-stack" id="qs">
      <figure className="q on" style={{margin:"0"} as React.CSSProperties}><blockquote>“They delivered a truly personalised and memorable experience. The attention to detail, the quality of the items and the on-time delivery made it a perfect gift.”</blockquote><cite>Sandra A.<span>Custom box for her mum's 60th birthday</span></cite></figure>
      <figure className="q" style={{margin:"0"} as React.CSSProperties}><blockquote>“The attention to detail in the packaging and the thoughtful selection of items inside showed a lot of care. I felt truly appreciated.”</blockquote><cite>Oluwaseun A.<span>A surprise from her best friend</span></cite></figure>
      <figure className="q" style={{margin:"0"} as React.CSSProperties}><blockquote>“The packaging was exquisite, and the contents were delightful. She couldn't stop raving about it.”</blockquote><cite>Chinelo O.<span>Birthday gift for her sister</span></cite></figure>
    </div>
  </div>
</section>

<section className="pad" id="more">
  <div className="wrap">
    <div className="head rv"><h2><span className="script">More</span> ways we help</h2><p>Plan ahead, run the office gift exchange, or flip through this season's boxes.</p></div>
    <div className="trio rv">
      <Link className="f cal" to="/calendar"><div><span className="s">never miss it</span><h3>Gift Calendar</h3><p>Every gifting date of the year, with order-by reminders for yours.</p></div><div className="date"><b>19</b><span>November<br />International Men's Day</span></div></Link>
      <Link className="f santa" to="/secret-santa"><div><span className="s">sorted</span><h3>Secret Santa</h3><p>We draw the names, wrap the gifts and deliver them. You enjoy the reveal.</p></div><div className="code" aria-label="Join with a code"><i>B</i><i>O</i><i>X</i><i>2</i><i>6</i></div></Link>
      <Link className="f look" to="/lookbook"><div><span className="s">page by page</span><h3>The Look Book</h3><p>This season's boxes in a digital catalogue you can share with your team.</p></div><div className="pages"><img src="/home/p09.jpg" alt="" /><img src="/home/p15.jpg" alt="" /><img src="/home/p10.jpg" alt="" /></div></Link>
    </div>
  </div>
</section>

<section className="close pad">
  <div className="wrap rv">
    <span className="script">let's create a wow</span>
    <h2>Tell us who it's for. We'll do the rest.</h2>
    <div className="ctas"><Link className="btn btn-ink" to="/shop">Shop gifts <span className="arr">→</span></Link><Link className="btn btn-line" to="/corporate/quote">Get a corporate quote</Link></div>
  </div>
</section>

  </div>;
}
