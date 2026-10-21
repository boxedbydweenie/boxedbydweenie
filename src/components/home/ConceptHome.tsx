// Homepage built from the approved concept (October 2026). Styles live in src/styles/home.css, scoped to .bbd-home.
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import type React from "react";
import { useHomeMotion } from "./useHomeMotion";
import { Photo } from "./Photo";
import { BRAND } from "@/data/brand";
import { ClientWall, Label, StatBadges } from "@/components/brand/ProfileSections";

export function ConceptHome() {
  const root = useRef<HTMLDivElement>(null);
  useHomeMotion(root);
  return <div ref={root} className="bbd-home">

<section className="hero2 brand-pattern-green" aria-label="Introduction">
  <div className="wrap hero2-grid">
    <div className="hero2-copy">
      <p className="eyebrow" style={{color:"var(--gold)"} as React.CSSProperties}>Luxury gifts &amp; packaging · Lagos</p>
      <h1 className="hero2-h1">
        <span className="rise"><span>Moments,</span></span>
        <span className="rise gold" style={{"--d":1} as React.CSSProperties}><span>boxed.</span></span>
      </h1>
      <p className="hero2-lede">We curate, wrap and deliver gifts people keep talking about. For the ones you love, and the people who keep your business running.</p>
      <div className="hero2-ctas">
        <Link className="btn btn-gold" to="/shop">Shop gifts <span className="arr">→</span></Link>
        <Link className="btn btn-line" to="/corporate">Corporate gifting</Link>
      </div>
      <div className="hero2-pills"><span className="pill pill-gold">Personal and corporate</span><span className="pill pill-coral">Nationwide delivery</span><span className="pill pill-sage">Nigeria and the UK</span></div>
    </div>
    <div className="hero2-art" aria-hidden="true">
      <div className="hero2-frame"></div>
      <Photo name="hero" priority className="hero2-main" sizes="(min-width: 900px) 40vw, 90vw" />
      <Photo name="door-personal" className="hero2-small" sizes="260px" />
      <div className="stat-orb stat-gold hero2-orb"><b>450+</b><span>happy clients</span></div>
    </div>
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

<section className="brand-pattern-black" style={{padding:"96px 0"} as React.CSSProperties}>
  <div className="wrap" style={{color:"#fff"} as React.CSSProperties}>
    <Label dark center>Trusted by</Label>
    <h2 className="big-h2" style={{textAlign:"center",marginTop:"28px",color:"var(--gold)",fontFamily:"var(--font-heading)"} as React.CSSProperties}>Over 5,000 boxes delivered to over 450 clients</h2>
    <div style={{marginTop:"56px"} as React.CSSProperties}><StatBadges brand={BRAND} /></div>
    <div style={{marginTop:"56px"} as React.CSSProperties}><ClientWall brand={BRAND} /></div>
  </div>
</section>

<section className="brand-pattern-green" style={{padding:"96px 0",color:"#fff"} as React.CSSProperties}>
  <div className="wrap" style={{display:"grid",gap:"48px",alignItems:"center"} as React.CSSProperties}>
    <div className="profile-teaser">
      <Link to="/profile" aria-label="Read the Boxed by Dweenie company profile" className="profile-book">
        <img src="/profile/p01.webp" alt="" loading="lazy" />
        <img src="/profile/p03.webp" alt="" loading="lazy" className="under" />
      </Link>
      <div>
        <Label dark>Company profile</Label>
        <h2 className="big-h2" style={{marginTop:"24px",color:"#fff",fontFamily:"var(--font-heading)"} as React.CSSProperties}>Happiness <span style={{color:"var(--gold)"} as React.CSSProperties}>In a Box</span></h2>
        <p style={{marginTop:"18px",maxWidth:"34rem",color:"rgba(255,255,255,.78)",lineHeight:1.7} as React.CSSProperties}>Our story, our boxes, our clients and how we work with you. Turn the pages online.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"12px",marginTop:"28px"} as React.CSSProperties}><Link className="btn btn-gold" to="/profile">Read the profile <span className="arr">→</span></Link><Link className="btn btn-line" to="/corporate/quote">Get an instant quote</Link></div>
      </div>
    </div>
  </div>
</section>

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
