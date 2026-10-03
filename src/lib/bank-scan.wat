;; bank-scan.ts's per-pixel loops, by hand, mostly 4 or 16 pixels at a time (SIMD): finding count text,
;; finding what isn't background, and scoring a template against the screenshot.
;; Built into bank-scan.wasm.ts by scripts/build-wasm.mts (by the dev, build, start and test scripts, first).
;;
;; Memory is the page's (imported), laid out by bank-scan.ts. Pixels are RGBA, so a pixel read as an i32
;; is 0xAABBGGRR: colours are passed in that order. The SIMD loops can run up to 64 bytes past what they're
;; given, so the page leaves that spare at the end.
(module
  (import "env" "memory" (memory 1))

  ;; Count text (see bank-scan.ts's `findText`): 1 for each of the `n` pixels that's one of the six text
  ;; colours, then 2 for the shadow, one down and right of each, if it isn't text itself; written from `out`.
  (func (export "text")
    (param $n i32) (param $width i32) (param $out i32)
    (param $c0 i32) (param $c1 i32) (param $c2 i32) (param $c3 i32) (param $c4 i32) (param $c5 i32)
    (local $i i32) (local $j i32)
    ;; 16 pixels at a time: whether each is text, as a byte.
    (loop $pixels
      (v128.store (i32.add (local.get $out) (local.get $i))
        (v128.and
          (i8x16.narrow_i16x8_s
            (i16x8.narrow_i32x4_s
              (call $isText (i32.shl (local.get $i) (i32.const 2))
                (local.get $c0) (local.get $c1) (local.get $c2) (local.get $c3) (local.get $c4) (local.get $c5))
              (call $isText (i32.shl (i32.add (local.get $i) (i32.const 4)) (i32.const 2))
                (local.get $c0) (local.get $c1) (local.get $c2) (local.get $c3) (local.get $c4) (local.get $c5)))
            (i16x8.narrow_i32x4_s
              (call $isText (i32.shl (i32.add (local.get $i) (i32.const 8)) (i32.const 2))
                (local.get $c0) (local.get $c1) (local.get $c2) (local.get $c3) (local.get $c4) (local.get $c5))
              (call $isText (i32.shl (i32.add (local.get $i) (i32.const 12)) (i32.const 2))
                (local.get $c0) (local.get $c1) (local.get $c2) (local.get $c3) (local.get $c4) (local.get $c5))))
          (i8x16.splat (i32.const 1))))
      (local.set $i (i32.add (local.get $i) (i32.const 16)))
      (br_if $pixels (i32.lt_u (local.get $i) (local.get $n))))
    ;; Then the shadows, 16 at a time: a pixel that isn't text, one down and right of one that is. In place,
    ;; going forwards: the 2s already written were 0s, so they're still not text.
    (local.set $j (i32.add (local.get $width) (i32.const 1)))
    (block $done
      (br_if $done (i32.ge_u (local.get $j) (local.get $n)))
      (loop $shadows
        (v128.store (i32.add (local.get $out) (local.get $j))
          (v128.or
            (v128.load (i32.add (local.get $out) (local.get $j)))
            (v128.and
              (v128.and
                (i8x16.eq (v128.load (i32.add (local.get $out) (local.get $j))) (i8x16.splat (i32.const 0)))
                (i8x16.eq
                  (v128.load (i32.sub (i32.add (local.get $out) (local.get $j)) (i32.add (local.get $width) (i32.const 1))))
                  (i8x16.splat (i32.const 1))))
              (i8x16.splat (i32.const 2)))))
        (local.set $j (i32.add (local.get $j) (i32.const 16)))
        (br_if $shadows (i32.lt_u (local.get $j) (local.get $n)))))
    ;; A row's first pixel got the shadow of the end of the row two up: there's none there.
    (local.set $j (local.get $width))
    (block $done
      (loop $rows
        (br_if $done (i32.ge_u (local.get $j) (local.get $n)))
        (if (i32.eq (i32.load8_u (i32.add (local.get $out) (local.get $j))) (i32.const 2))
          (then (i32.store8 (i32.add (local.get $out) (local.get $j)) (i32.const 0))))
        (local.set $j (i32.add (local.get $j) (local.get $width)))
        (br $rows))))

  ;; Whether each of 4 pixels from `p` is one of the six colours: -1 in its lane if so.
  (func $isText (param $p i32)
    (param $c0 i32) (param $c1 i32) (param $c2 i32) (param $c3 i32) (param $c4 i32) (param $c5 i32)
    (result v128)
    (local $v v128)
    (local.set $v (v128.and (v128.load (local.get $p)) (i32x4.splat (i32.const 0x00ffffff))))
    (v128.or
      (v128.or
        (v128.or (i32x4.eq (local.get $v) (i32x4.splat (local.get $c0))) (i32x4.eq (local.get $v) (i32x4.splat (local.get $c1))))
        (v128.or (i32x4.eq (local.get $v) (i32x4.splat (local.get $c2))) (i32x4.eq (local.get $v) (i32x4.splat (local.get $c3)))))
      (v128.or (i32x4.eq (local.get $v) (i32x4.splat (local.get $c4))) (i32x4.eq (local.get $v) (i32x4.splat (local.get $c5))))))

  ;; What might be icons (see bank-scan.ts's `findShapes`): 1 for each of the `n` pixels that isn't count
  ;; text (0 in `text`) and has a colour channel more than `tolerance` off the background's; written from
  ;; `out`, 16 at a time.
  (func (export "foreground")
    (param $n i32) (param $background i32) (param $tolerance i32) (param $text i32) (param $out i32)
    (local $i i32)
    (loop $pixels
      (v128.store (i32.add (local.get $out) (local.get $i))
        (v128.and
          (v128.and
            (i8x16.narrow_i16x8_s
              (i16x8.narrow_i32x4_s
                (call $far (i32.shl (local.get $i) (i32.const 2)) (local.get $background) (local.get $tolerance))
                (call $far (i32.shl (i32.add (local.get $i) (i32.const 4)) (i32.const 2)) (local.get $background) (local.get $tolerance)))
              (i16x8.narrow_i32x4_s
                (call $far (i32.shl (i32.add (local.get $i) (i32.const 8)) (i32.const 2)) (local.get $background) (local.get $tolerance))
                (call $far (i32.shl (i32.add (local.get $i) (i32.const 12)) (i32.const 2)) (local.get $background) (local.get $tolerance))))
            (i8x16.eq (v128.load (i32.add (local.get $text) (local.get $i))) (i8x16.splat (i32.const 0))))
          (i8x16.splat (i32.const 1))))
      (local.set $i (i32.add (local.get $i) (i32.const 16)))
      (br_if $pixels (i32.lt_u (local.get $i) (local.get $n)))))

  ;; Whether each of 4 pixels from `p` has a colour channel more than `tolerance` off `background`'s: -1 in
  ;; its lane if so.
  (func $far (param $p i32) (param $background i32) (param $tolerance i32) (result v128)
    (local $v v128) (local $b v128)
    (local.set $v (v128.load (local.get $p)))
    (local.set $b (i32x4.splat (local.get $background)))
    (i32x4.ne
      (v128.and
        (i8x16.gt_u
          (v128.or (i8x16.sub_sat_u (local.get $v) (local.get $b)) (i8x16.sub_sat_u (local.get $b) (local.get $v)))
          (i8x16.splat (local.get $tolerance)))
        (i32x4.splat (i32.const 0x00ffffff)))
      (i32x4.splat (i32.const 0))))

  ;; |a - b|
  (func $diff (param $a i32) (param $b i32) (result i32)
    (local $d i32)
    (local.set $d (i32.sub (local.get $a) (local.get $b)))
    (select (local.get $d) (i32.sub (i32.const 0) (local.get $d)) (i32.ge_s (local.get $d) (i32.const 0))))

  ;; The misses (-1 once there are more than `allowed`, as it stops there) and the summed error: 4 pixels
  ;; at a time when the template's wholly on the screenshot, as it nearly always is, else one by one.
  (func (export "score")
    (param $width i32) (param $height i32) (param $t i32) (param $tw i32) (param $th i32)
    (param $left i32) (param $top i32) (param $allowed i32)
    (result i32 i32)
    (if (result i32 i32)
      (i32.and
        (i32.and (i32.ge_s (local.get $left) (i32.const 0)) (i32.ge_s (local.get $top) (i32.const 0)))
        (i32.and
          (i32.le_s (i32.add (local.get $left) (local.get $tw)) (local.get $width))
          (i32.le_s (i32.add (local.get $top) (local.get $th)) (local.get $height))))
      (then (call $simd (local.get $width) (local.get $t) (local.get $tw) (local.get $th)
        (local.get $left) (local.get $top) (local.get $allowed)))
      (else (call $scalar (local.get $width) (local.get $height) (local.get $t) (local.get $tw) (local.get $th)
        (local.get $left) (local.get $top) (local.get $allowed)))))

  (func $sum (param $v v128) (result i32)
    (i32.add
      (i32.add (i32x4.extract_lane 0 (local.get $v)) (i32x4.extract_lane 1 (local.get $v)))
      (i32.add (i32x4.extract_lane 2 (local.get $v)) (i32x4.extract_lane 3 (local.get $v)))))

  ;; `score` with the template wholly on the screenshot, 4 pixels (16 bytes) at a time. Each lane of
  ;; $misses and $error is one pixel's column, mod 4; they're summed at the end of each row.
  (func $simd
    (param $width i32) (param $t i32) (param $tw i32) (param $th i32)
    (param $left i32) (param $top i32) (param $allowed i32)
    (result i32 i32)
    (local $x i32) (local $y i32) (local $s i32)
    (local $a v128) (local $b v128) (local $diff v128) (local $miss v128) (local $valid v128)
    (local $misses v128) (local $error v128)

    (loop $rows
      ;; The screenshot's row, from the template's left.
      (local.set $s (i32.shl
        (i32.add (i32.mul (i32.add (local.get $top) (local.get $y)) (local.get $width)) (local.get $left))
        (i32.const 2)))
      (local.set $x (i32.const 0))
      (loop $columns
        (local.set $a (v128.load (i32.add (local.get $s) (i32.shl (local.get $x) (i32.const 2)))))
        (local.set $b (v128.load (i32.add (local.get $t) (i32.shl (local.get $x) (i32.const 2)))))
        ;; |a - b| per byte: one of the two saturating subtractions is 0.
        (local.set $diff (v128.or (i8x16.sub_sat_u (local.get $a) (local.get $b))
                                  (i8x16.sub_sat_u (local.get $b) (local.get $a))))
        ;; A pixel misses if a colour channel's further off than 255 - its alpha (copied into every
        ;; channel by the swizzle; a clear pixel's 255, so never misses). Alpha bytes are masked off.
        (local.set $miss (i32x4.ne
          (v128.and
            (i8x16.gt_u (local.get $diff)
              (v128.not (i8x16.swizzle (local.get $b) (v128.const i8x16 3 3 3 3 7 7 7 7 11 11 11 11 15 15 15 15))))
            (v128.const i32x4 0x00ffffff 0x00ffffff 0x00ffffff 0x00ffffff))
          (v128.const i32x4 0 0 0 0)))
        ;; Pixels past the row's end (the last 4 can overrun it) don't count.
        (local.set $valid (i32x4.lt_s
          (i32x4.add (i32x4.splat (local.get $x)) (v128.const i32x4 0 1 2 3))
          (i32x4.splat (local.get $tw))))
        (local.set $miss (v128.and (local.get $miss) (local.get $valid)))
        ;; A miss is -1 in its lane.
        (local.set $misses (i32x4.sub (local.get $misses) (local.get $miss)))
        ;; The rest add their channels' differences, if they're part of the icon (alpha not 0).
        (local.set $error (i32x4.add (local.get $error)
          (v128.and
            (i32x4.extadd_pairwise_i16x8_u (i16x8.extadd_pairwise_i8x16_u
              (v128.and (local.get $diff) (v128.const i32x4 0x00ffffff 0x00ffffff 0x00ffffff 0x00ffffff))))
            (v128.and
              (v128.andnot (local.get $valid) (local.get $miss))
              (i32x4.ne
                (v128.and (local.get $b) (v128.const i32x4 0xff000000 0xff000000 0xff000000 0xff000000))
                (v128.const i32x4 0 0 0 0))))))
        (local.set $x (i32.add (local.get $x) (i32.const 4)))
        (br_if $columns (i32.lt_s (local.get $x) (local.get $tw))))
      (if (i32.gt_s (call $sum (local.get $misses)) (local.get $allowed))
        (then (return (i32.const -1) (i32.const 0))))
      (local.set $t (i32.add (local.get $t) (i32.shl (local.get $tw) (i32.const 2))))
      (local.set $y (i32.add (local.get $y) (i32.const 1)))
      (br_if $rows (i32.lt_s (local.get $y) (local.get $th))))
    (call $sum (local.get $misses))
    (call $sum (local.get $error)))

  ;; `score` one pixel at a time, for a template that's partly off the screenshot.
  (func $scalar
    (param $width i32) (param $height i32) ;; the screenshot's
    (param $t i32) (param $tw i32) (param $th i32) ;; the template's pixels, and its size
    (param $left i32) (param $top i32) (param $allowed i32)
    (result i32 i32)
    (local $x i32) (local $y i32) (local $sx i32) (local $sy i32) (local $s i32)
    (local $tolerance i32) (local $r i32) (local $g i32) (local $b i32)
    (local $misses i32) (local $error i32)

    (loop $rows
      (local.set $x (i32.const 0))
      (local.set $sy (i32.add (local.get $top) (local.get $y)))
      (loop $columns
        (block $next
          ;; A clear pixel's 0 alpha: not part of the icon.
          (br_if $next (i32.eqz (i32.load8_u offset=3 (local.get $t))))
          (local.set $tolerance (i32.sub (i32.const 255) (i32.load8_u offset=3 (local.get $t))))
          (local.set $sx (i32.add (local.get $left) (local.get $x)))
          (block $miss
            ;; Off the screenshot (unsigned, so negatives are too).
            (br_if $miss (i32.ge_u (local.get $sx) (local.get $width)))
            (br_if $miss (i32.ge_u (local.get $sy) (local.get $height)))
            (local.set $s (i32.shl
              (i32.add (i32.mul (local.get $sy) (local.get $width)) (local.get $sx))
              (i32.const 2)))
            (local.set $r (call $diff (i32.load8_u (local.get $s)) (i32.load8_u (local.get $t))))
            (local.set $g (call $diff (i32.load8_u offset=1 (local.get $s)) (i32.load8_u offset=1 (local.get $t))))
            (local.set $b (call $diff (i32.load8_u offset=2 (local.get $s)) (i32.load8_u offset=2 (local.get $t))))
            (br_if $miss (i32.gt_s (local.get $r) (local.get $tolerance)))
            (br_if $miss (i32.gt_s (local.get $g) (local.get $tolerance)))
            (br_if $miss (i32.gt_s (local.get $b) (local.get $tolerance)))
            (local.set $error
              (i32.add (local.get $error) (i32.add (local.get $r) (i32.add (local.get $g) (local.get $b)))))
            (br $next))
          (local.set $misses (i32.add (local.get $misses) (i32.const 1)))
          (if (i32.gt_s (local.get $misses) (local.get $allowed))
            (then (return (i32.const -1) (local.get $error)))))
        (local.set $t (i32.add (local.get $t) (i32.const 4)))
        (local.set $x (i32.add (local.get $x) (i32.const 1)))
        (br_if $columns (i32.lt_s (local.get $x) (local.get $tw))))
      (local.set $y (i32.add (local.get $y) (i32.const 1)))
      (br_if $rows (i32.lt_s (local.get $y) (local.get $th))))
    (local.get $misses)
    (local.get $error)))
