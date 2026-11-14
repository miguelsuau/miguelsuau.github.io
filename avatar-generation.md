# Avatar artwork

## Selected NFT avatar — connected beard correction

The original pixel/NFT avatar is now the default on the homepage and inner pages.
Final asset: `images/avatar-nft-beard.png`. Generated with the built-in GPT Image tool (not the CLI). The uncorrected NFT sheet was removed; its history remains in Git.

Final edit prompt: Correct only the beard on the third thinking face and fourth suspicious face. Match the first neutral and second hello faces: one broad, solid, continuous medium-brown pixel-art full beard wrapping the cheeks and jaw and continuing across the upper lip. The hair above the lip must join the beard on both sides of the mouth; do not add an isolated moustache. Keep the existing downturned thinking mouth and asymmetric suspicious mouth visible and preserve their expressions. Keep the first two characters, poses, clothing, eyes, hair, silhouettes, spacing, pixel style, transparency and 1536×1024 dimensions unchanged.

The selected artwork is rendered as a shallow solid cutout by `assets/js/avatar-model.js`. It uses nearest-neighbor filtering, a 0.44-unit extrusion, and the four existing pose states.

`images/avatar-pixel.png` is the fallback portrait. `images/industrial-cyberspace.png` remains the inner-page banner and non-WebGL scene fallback. The equipment itself is modeled in Three.js.

## Retained rendered alternative

The user requested keeping the 3D-looking rendered avatar as a backup. `images/avatar-rendered-poses.png`, `images/avatar-moustache-edits.png`, and `assets/js/avatar-artwork.js` are retained, with the rendered preview at `/avatar-comparison/` and NFT preview at `/avatar-comparison/nft/`. The main homepage, About and Research use the corrected NFT artwork.
