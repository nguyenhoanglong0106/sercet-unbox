export const REVEAL_PHASES = [
  'idle',
  'focus',
  'countdown',
  'shake',
  'tear',
  'open',
  'light',
  'poster-enter',
  'reveal-text',
  'celebrate',
  'complete',
];

function scaled(value, reduceMotion) {
  return reduceMotion ? Math.max(value * 0.32, 0.18) : value;
}

/**
 * Builds the presentation timeline as named stages so the UI, sound, and
 * poster state can stay in sync with the blind bag motion.
 */
export function buildRevealTimeline({
  gsap,
  bag,
  topStrip,
  poster,
  light,
  countdown,
  message,
  reduceMotion,
  setPhase,
  setCountdown,
  onSound,
  onCelebrate,
  onComplete,
}) {
  const d = {
    focus: scaled(1.1, reduceMotion),
    count: scaled(0.75, reduceMotion),
    shake: scaled(1.8, reduceMotion),
    tear: scaled(2, reduceMotion),
    open: scaled(1.3, reduceMotion),
    light: scaled(1.1, reduceMotion),
    poster: scaled(1.4, reduceMotion),
    text: scaled(1.2, reduceMotion),
    celebrate: scaled(0.7, reduceMotion),
  };

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.out' },
    onComplete,
  });

  if (poster) {
    tl.set(poster, { autoAlpha: 0, scale: 0.18, rotateX: 15, y: 70, filter: 'blur(14px)' });
  }
  if (light) {
    tl.set(light, { autoAlpha: 0, scale: 0.6 });
  }

  tl.call(() => {
    setPhase('focus');
    setCountdown('');
    onSound('click');
  });
  if (bag) tl.to(bag, { scale: 1.18, y: -10, duration: d.focus, ease: 'back.out(1.6)' });

  tl.call(() => {
    setPhase('countdown');
    setCountdown('3');
    onSound('magic');
    onSound('bagOpen');
  });
  pulseCountdown(tl, gsap, countdown, message, d.count);
  tl.call(() => setCountdown('2'));
  pulseCountdown(tl, gsap, countdown, message, d.count);
  tl.call(() => setCountdown('1'));
  pulseCountdown(tl, gsap, countdown, message, d.count);
  tl.call(() => setCountdown('Xé!'));
  pulseCountdown(tl, gsap, countdown, message, scaled(0.45, reduceMotion));

  tl.call(() => {
    setPhase('shake');
    onSound('magic');
  });
  if (bag) {
    tl.to(bag, {
      x: reduceMotion ? 4 : 13,
      rotation: reduceMotion ? 1 : 2.5,
      duration: scaled(0.08, reduceMotion),
      repeat: Math.round(d.shake / scaled(0.08, reduceMotion)),
      yoyo: true,
      ease: 'sine.inOut',
    });
    tl.to(bag, { x: 0, rotation: 0, duration: scaled(0.15, reduceMotion) });
  }

  tl.call(() => {
    setPhase('tear');
    onSound('paper');
  });
  if (topStrip) {
    tl.to(topStrip, { x: 18, rotation: -2, duration: d.tear * 0.45 }, '<');
  }

  tl.call(() => setPhase('open'));
  if (topStrip) {
    tl.to(topStrip, { y: -150, x: -60, rotation: -18, duration: d.open, ease: 'back.in(1.2)' });
  }
  if (bag) tl.to(bag, { y: 55, scale: 0.96, duration: d.open }, '<');

  tl.call(() => setPhase('light'));
  if (light) {
    tl.to(light, { autoAlpha: 1, scale: 1.25, duration: d.light * 0.45 }, '<');
    tl.to(light, { autoAlpha: 0.2, scale: 1.55, duration: d.light * 0.55 });
  }

  tl.call(() => setPhase('poster-enter'));
  if (poster) {
    tl.to(
      poster,
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: d.poster,
        ease: 'back.out(1.5)',
      },
      '<',
    );
  }
  if (bag) tl.to(bag, { y: 190, duration: d.poster }, '<');

  tl.call(() => setPhase('reveal-text'));
  if (poster) tl.to(poster, { scale: 1.02, duration: d.text * 0.45, yoyo: true, repeat: 1 });

  tl.call(() => {
    setPhase('celebrate');
    onSound('wow');
    onCelebrate();
  });
  if (light) tl.to(light, { autoAlpha: 0, duration: d.celebrate }, '<');

  tl.call(() => {
    setPhase('complete');
    setCountdown('');
  });

  return tl;
}

function pulseCountdown(tl, gsap, countdown, message, duration) {
  if (countdown) {
    tl.fromTo(countdown, { scale: 0.5 }, { scale: 1.15, duration: duration * 0.32, ease: 'back.out(2)' });
    tl.to(countdown, { scale: 1, duration: duration * 0.32 }, `+=${duration * 0.36}`);
  } else if (message) {
    tl.to(message, { scale: 1.04, duration: duration * 0.5, yoyo: true, repeat: 1 });
  } else {
    tl.to({}, { duration });
  }
}
