/**
 * Maps every tile type string to the corresponding image in
 * assets/images/96/fulltiles/.
 *
 * Verified by inspecting each image file:
 *   pinyin1  = 中  (dragon_red)
 *   pinyin2  = 發  (dragon_green)
 *   pinyin3  = 南  (wind_south)
 *   pinyin4  = 東  (wind_east)
 *   pinyin5  = 北  (wind_north)
 *   pinyin6  = 西  (wind_west)
 *   pinyin7  = 四萬 (character_4)
 *   pinyin8  = 伍萬 (character_5)
 *   pinyin9  = 六萬 (character_6)
 *   pinyin10 = 七萬 (character_7)
 *   pinyin11 = 八萬 (character_8)
 *   pinyin12 = 九萬 (character_9)
 *   pinyin13 = 一萬 (character_1)
 *   pinyin14 = 二萬 (character_2)
 *   pinyin15 = 三萬 (character_3)
 *   lotus    = 荷花 (flower_bamboo_flower)
 *   orchid   = 蘭花 (flower_orchid)
 *   chrysanthemum = 菊花 (flower_chrysanthemum)
 *   peony    = 牡丹 (flower_plum)
 *   spring / summer / fall / winter = seasons
 *
 * dragon_white has no dedicated image — the tile renders as plain text.
 */
export const TILE_IMAGES: Record<string, number> = {
  // ── Bamboo (竹) ─────────────────────────────────────────────────────────
  bamboo_1: require('../../../assets/images/64/labels/bamboo1.png'),
  bamboo_2: require('../../../assets/images/64/labels/bamboo2.png'),
  bamboo_3: require('../../../assets/images/64/labels/bamboo3.png'),
  bamboo_4: require('../../../assets/images/64/labels/bamboo4.png'),
  bamboo_5: require('../../../assets/images/64/labels/bamboo5.png'),
  bamboo_6: require('../../../assets/images/64/labels/bamboo6.png'),
  bamboo_7: require('../../../assets/images/64/labels/bamboo7.png'),
  bamboo_8: require('../../../assets/images/64/labels/bamboo8.png'),
  bamboo_9: require('../../../assets/images/64/labels/bamboo9.png'),

  // ── Circle / Bing (餅) ──────────────────────────────────────────────────
  circle_1: require('../../../assets/images/64/labels/circle1.png'),
  circle_2: require('../../../assets/images/64/labels/circle2.png'),
  circle_3: require('../../../assets/images/64/labels/circle3.png'),
  circle_4: require('../../../assets/images/64/labels/circle4.png'),
  circle_5: require('../../../assets/images/64/labels/circle5.png'),
  circle_6: require('../../../assets/images/64/labels/circle6.png'),
  circle_7: require('../../../assets/images/64/labels/circle7.png'),
  circle_8: require('../../../assets/images/64/labels/circle8.png'),
  circle_9: require('../../../assets/images/64/labels/circle9.png'),

  // ── Character / Wan (萬) — pinyin13=一, 14=二, 15=三, 7=四, 8=五, 9=六, 10=七, 11=八, 12=九
  character_1: require('../../../assets/images/64/labels/pinyin13.png'),
  character_2: require('../../../assets/images/64/labels/pinyin14.png'),
  character_3: require('../../../assets/images/64/labels/pinyin15.png'),
  character_4: require('../../../assets/images/64/labels/pinyin7.png'),
  character_5: require('../../../assets/images/64/labels/pinyin8.png'),
  character_6: require('../../../assets/images/64/labels/pinyin9.png'),
  character_7: require('../../../assets/images/64/labels/pinyin10.png'),
  character_8: require('../../../assets/images/64/labels/pinyin11.png'),
  character_9: require('../../../assets/images/64/labels/pinyin12.png'),

  // ── Winds (風) ──────────────────────────────────────────────────────────
  wind_east:  require('../../../assets/images/64/labels/pinyin4.png'),   // 東
  wind_south: require('../../../assets/images/64/labels/pinyin3.png'),   // 南
  wind_west:  require('../../../assets/images/64/labels/pinyin6.png'),   // 西
  wind_north: require('../../../assets/images/64/labels/pinyin5.png'),   // 北

  // ── Dragons (龍) ────────────────────────────────────────────────────────
  dragon_red:   require('../../../assets/images/64/labels/pinyin1.png'),  // 中
  dragon_green: require('../../../assets/images/64/labels/pinyin2.png'),  // 發
  dragon_white: require('../../../assets/images/white dragon.png'),       // 白板

  // ── Seasons (季節) ──────────────────────────────────────────────────────
  season_spring: require('../../../assets/images/64/labels/spring.png'),
  season_summer: require('../../../assets/images/64/labels/summer.png'),
  season_autumn: require('../../../assets/images/64/labels/fall.png'),
  season_winter: require('../../../assets/images/64/labels/winter.png'),

  // ── Flowers (花) ────────────────────────────────────────────────────────
  flower_plum:          require('../../../assets/images/64/labels/peony.png'),         // 牡丹 (plum blossom)
  flower_orchid:        require('../../../assets/images/64/labels/orchid.png'),        // 蘭花
  flower_chrysanthemum: require('../../../assets/images/64/labels/chrysanthemum.png'),// 菊花
  flower_bamboo_flower: require('../../../assets/images/64/labels/lotus.png'),         // 荷花
};
