# Avatar generation

Created with the built-in ImageGen tool, using the supplied pixel-art portrait as the identity reference. The final sheet is `images/avatar-poses.png`; the original portrait is `images/avatar-pixel.png`.

## Initial prompt

Create one transparent 1536 × 1024 sprite sheet with exactly four equal-width columns. Extend the reference character to a full body, preserving curly brown hair, beard, tan skin, blue eyes, charcoal open jacket and white T-shirt; add dark trousers and sneakers. Keep every figure at the same scale and baseline, fully inside its own cell. Left to right: relaxed standing, one-hand wave, hand-on-chin thinking, pointing right. Crisp chunky pixel art, black outlines, limited warm colors. Actual transparent alpha, no labels, grid, backdrop, shadows or text.

## Expression refinement

Preserve the canvas, four columns, poses, scale and identity. First face neutral, small closed mouth and relaxed eyebrows. Second face happily smiling and waving; only this pose smiles. Third face thinking, eyes up and to the side, one raised eyebrow, closed mouth. Fourth face suspicious, narrowed side-eye and asymmetric eyebrows, closed downturned mouth. No smile or teeth in poses one, three or four.

## Mouth refinement prompt

Use case: identity-preserve. Precise targeted EDIT to attached pixel-art sprite sheet. Change ONLY the mouths and nearby beard pixels on characters 3 and 4. Everything else stays EXACTLY unchanged: characters 1 and 2 entirely unchanged, all poses, head positions and sizes, all body pixels, four equal 384px columns on 1536x1024 canvas, transparent background, eye and eyebrow expressions on characters 3 and 4. Third thinking character: replace the crooked squiggly mouth with a SIMPLE SMALL CLOSED STRAIGHT horizontal dark mouth line, centered under nose, about 2 or 3 chunky pixels wide, no smile, no extra marks below or around it. Restore a natural tidy brown moustache and beard around it matching character 1. Fourth suspicious character: replace the thick sideways zigzag with a clean subtle DOWN-TURNED CLOSED mouth, a short horizontal dark center with one-pixel downward ends, 3 chunky pixels wide total, no smile, no teeth, no diagonal zigzag. Tidy brown moustache and beard matching character 1, while retaining suspicious side-eye and raised eyebrow. Keep the mouths restrained and human, simple classic pixel-art expressions that remain readable at small sizes. No new details elsewhere, no text, transparent alpha.

## Final prompt: requested mouth assignment

Use case: identity-preserve. Precise tiny mouth-edit on a 4-pose pixel-art sprite sheet. IMAGE 1 is the current base/edit target. IMAGE 2 is an older version used ONLY as a mouth reference for character 4. Preserve IMAGE 1 pixel-for-pixel everywhere except the mouth regions of characters 3 and 4. User explicitly wants: (A) On IMAGE 1 character 3 (thinking hand at chin), use the downturned mouth currently on IMAGE 1 character 4. Copy its short horizontal black center with downward pixel corners, preserving the thinking character's eyes, raised eyebrow, head position and beard identity. (B) On IMAGE 1 character 4 (pointing, suspicious side-eye), RESTORE the exact crooked sideways mouth from IMAGE 2 character 4: a short asymmetric closed dark line slanting upward on the right, rather than the new symmetrical downturned frown. Preserve the suspicious eyes and eyebrows. Characters 1 neutral and 2 waving smile remain entirely unchanged. Only pose 2 smiles. Keep exact 1536x1024 transparent canvas and four equal 384px cells, identical figure placement, scale, outlines, colors, clothes, hair, full-body poses and baseline. No new details. True transparent background with alpha, no glow outside characters.
