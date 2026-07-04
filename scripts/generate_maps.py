"""
ch2/ch3/ch4 独立地图素材生成器

输出：
  frontend/public/assets/maps/ch2-sakura-layered-chunks/chunk-r{0-2}-c{0-3}.png  (12 块, 樱花季粉绿)
  frontend/public/assets/maps/ch3-cyber-layered-chunks/chunk-r{0-2}-c{0-3}.png   (12 块, 智械危机暗紫)
  frontend/public/assets/maps/ch4-anniv-layered-chunks/chunk-r{0-2}-c{0-3}.png   (12 块, 校庆金棕红)
  frontend/public/assets/maps/ch2-sakura-layered.json  (地图配置)
  frontend/public/assets/maps/ch3-cyber-layered.json   (地图配置)
  frontend/public/assets/maps/ch4-anniv-layered.json   (地图配置)

每块 2500×2000，3 行 × 4 列 = 10000×6000 世界坐标（与 ch1 对齐）。
"""

import os
import random
import json
from PIL import Image, ImageDraw, ImageFilter

# === 全局配置 ===
OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "assets", "maps")
CHUNK_W, CHUNK_H = 2500, 2000
ROWS, COLS = 3, 4
WORLD_W, WORLD_H = CHUNK_W * COLS, CHUNK_H * ROWS  # 10000 × 6000
SEED = 20260704

# === 三章主题配色（GB/T 1526 视觉规范，章节差异化）===
THEMES = {
    "ch2-sakura": {
        "name": "sakura-layered-v1",
        "bg": (245, 213, 222),       # 浅粉底
        "grass": (144, 201, 168),    # 草地绿
        "grass_dark": (108, 168, 132),
        "building": (139, 107, 90),  # 实验室棕红
        "building_dark": (98, 72, 60),
        "path": (232, 224, 208),     # 米黄道路
        "path_edge": (200, 192, 176),
        "water": (168, 216, 232),    # 浅蓝水池
        "tree_canopy": (255, 183, 197),  # 樱花粉
        "tree_canony_dark": (220, 140, 165),
        "trunk": (107, 68, 35),
        "accent": (255, 105, 139),   # 樱花深粉
        "deco": "sakura",            # 装饰类型
    },
    "ch3-cyber": {
        "name": "cyber-layered-v1",
        "bg": (31, 31, 58),          # 暗紫底
        "grass": (50, 50, 78),       # 紫灰地板
        "grass_dark": (35, 35, 58),
        "building": (74, 106, 154),  # 科技蓝机柜
        "building_dark": (42, 58, 90),
        "path": (90, 90, 130),       # 蓝紫道路
        "path_edge": (60, 60, 95),
        "water": (40, 80, 130),      # 冷却液蓝
        "tree_canopy": (0, 255, 204),  # 屏幕青
        "tree_canopy_dark": (0, 180, 140),
        "trunk": (90, 90, 130),
        "accent": (255, 170, 0),     # 警告橙
        "deco": "cyber",
    },
    "ch4-anniv": {
        "name": "anniv-layered-v1",
        "bg": (244, 228, 188),       # 浅金米
        "grass": (212, 184, 136),    # 金棕地砖
        "grass_dark": (180, 152, 104),
        "building": (139, 90, 43),   # 校史馆棕
        "building_dark": (98, 60, 28),
        "path": (232, 215, 175),     # 米黄道路
        "path_edge": (200, 180, 140),
        "water": (140, 180, 200),    # 喷泉蓝
        "tree_canopy": (200, 16, 46),  # 校庆红
        "tree_canopy_dark": (160, 8, 36),
        "trunk": (107, 68, 35),
        "accent": (255, 215, 0),     # 金色
        "deco": "anniv",
    },
}


def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, int(v)))


def jitter(color, amt=15):
    """颜色随机抖动，制造纹理感"""
    return tuple(clamp(c + random.randint(-amt, amt)) for c in color[:3])


def draw_noise_rect(draw, x, y, w, h, color, noise_amt=10, cell=40):
    """绘制带噪点的矩形（块状纹理）"""
    for cy in range(y, y + h, cell):
        for cx in range(x, x + w, cell):
            cw = min(cell, x + w - cx)
            ch = min(cell, y + h - cy)
            draw.rectangle([cx, cy, cx + cw, cy + ch], fill=jitter(color, noise_amt))


def draw_sakura_tree(draw, cx, cy, scale=1.0):
    """樱花树：粉色冠 + 棕色干"""
    trunk_w = int(20 * scale)
    trunk_h = int(60 * scale)
    draw.rectangle(
        [cx - trunk_w // 2, cy, cx + trunk_w // 2, cy + trunk_h],
        fill=(107, 68, 35)
    )
    # 多层圆冠
    canopy_r = int(80 * scale)
    for dx, dy in [(0, 0), (-30, 10), (30, 10), (0, -25), (-20, -15), (20, -15)]:
        draw.ellipse(
            [cx + dx - canopy_r // 2, cy + dy - canopy_r // 2,
             cx + dx + canopy_r // 2, cy + dy + canopy_r // 2],
            fill=jitter((255, 183, 197), 20)
        )


def draw_cyber_rack(draw, cx, cy, scale=1.0):
    """机柜：蓝紫长方体 + 警告条 + 屏幕"""
    w, h = int(120 * scale), int(200 * scale)
    # 主体
    draw.rectangle([cx - w // 2, cy, cx + w // 2, cy + h], fill=(74, 106, 154))
    draw.rectangle([cx - w // 2, cy, cx + w // 2, cy + h], outline=(42, 58, 90), width=3)
    # 警告条
    for i in range(3):
        y = cy + 30 + i * 50
        draw.rectangle([cx - w // 2 + 8, y, cx + w // 2 - 8, y + 20],
                       fill=(255, 170, 0) if i % 2 == 0 else (0, 255, 204))
    # 屏幕
    draw.rectangle([cx - 20, cy + 160, cx + 20, cy + 180], fill=(0, 255, 204))


def draw_anniv_pillar(draw, cx, cy, scale=1.0):
    """校庆纪念柱：米白柱 + 金色装饰"""
    w, h = int(40 * scale), int(160 * scale)
    # 柱身
    draw.rectangle([cx - w // 2, cy, cx + w // 2, cy + h], fill=(224, 208, 176))
    draw.rectangle([cx - w // 2, cy, cx + w // 2, cy + h], outline=(139, 90, 43), width=2)
    # 顶部金色球
    draw.ellipse([cx - 25, cy - 30, cx + 25, cy + 10], fill=(255, 215, 0))
    # 底座
    draw.rectangle([cx - w // 2 - 10, cy + h, cx + w // 2 + 10, cy + h + 15],
                   fill=(139, 90, 43))


def draw_flag(draw, cx, cy, color=(200, 16, 46)):
    """彩旗：三角旗 + 杆"""
    draw.line([cx, cy, cx, cy + 120], fill=(80, 80, 80), width=3)
    draw.polygon([(cx, cy), (cx + 50, cy + 20), (cx, cy + 40)], fill=color)


def draw_building_block(draw, x, y, w, h, theme):
    """建筑/边缘块（顶部 1220px 不可走区域）"""
    # 主色块
    draw_noise_rect(draw, x, y, w, h, theme["building"], noise_amt=12, cell=80)
    # 窗户/装饰条
    if theme["deco"] == "cyber":
        # 机房窗户：青色发光小窗
        for wy in range(y + 100, y + h - 100, 200):
            for wx in range(x + 100, x + w - 100, 250):
                draw.rectangle([wx, wy, wx + 80, wy + 60], fill=(0, 255, 204))
                draw.rectangle([wx, wy, wx + 80, wy + 60], outline=(42, 58, 90), width=2)
    elif theme["deco"] == "sakura":
        # 实验室窗户：暖黄方块
        for wy in range(y + 100, y + h - 100, 200):
            for wx in range(x + 100, x + w - 100, 250):
                draw.rectangle([wx, wy, wx + 80, wy + 60], fill=(255, 220, 130))
                draw.rectangle([wx, wy, wx + 80, wy + 60], outline=(98, 72, 60), width=2)
    else:  # anniv
        # 校史馆窗户：拱形
        for wy in range(y + 100, y + h - 100, 200):
            for wx in range(x + 100, x + w - 100, 250):
                draw.rectangle([wx, wy, wx + 80, wy + 50], fill=(180, 130, 80))
                draw.pieslice([wx, wy - 30, wx + 80, wy + 30], 180, 360, fill=(180, 130, 80))


def draw_grass_block(draw, x, y, w, h, theme):
    """绿地/底部边缘块"""
    draw_noise_rect(draw, x, y, w, h, theme["grass"], noise_amt=10, cell=60)
    # 散布小草点
    for _ in range(60):
        px = random.randint(x, x + w)
        py = random.randint(y, y + h)
        draw.rectangle([px, py, px + 4, py + 8], fill=theme["grass_dark"])


def draw_path_grid(draw, x, y, w, h, theme):
    """道路网格（中间可走区域）"""
    # 主底
    draw_noise_rect(draw, x, y, w, h, theme["path"], noise_amt=8, cell=100)
    # 网格线
    grid = 200
    for gx in range(x, x + w, grid):
        draw.line([(gx, y), (gx, y + h)], fill=theme["path_edge"], width=2)
    for gy in range(y, y + h, grid):
        draw.line([(x, gy), (x + w, gy)], fill=theme["path_edge"], width=2)


def draw_water_pool(draw, cx, cy, w, h, theme):
    """水池"""
    draw.ellipse([cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2],
                 fill=theme["water"])
    draw.ellipse([cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2],
                 outline=theme["path_edge"], width=3)
    # 涟漪
    for r in range(20, min(w, h) // 2, 40):
        draw.ellipse([cx - r, cy - r // 2, cx + r, cy + r // 2],
                     outline=(255, 255, 255, 80), width=1)


def generate_chunk(theme_name, theme, r, c):
    """生成单块 chunk"""
    random.seed(SEED + r * 100 + c + hash(theme_name) % 10000)
    img = Image.new("RGB", (CHUNK_W, CHUNK_H), theme["bg"])
    draw = ImageDraw.Draw(img)

    # 1. 整块底色（道路网格）
    draw_path_grid(draw, 0, 0, CHUNK_W, CHUNK_H, theme)

    # 2. 顶部建筑带（仅 r=0 行的顶部）
    if r == 0:
        draw_building_block(draw, 0, 0, CHUNK_W, 1220, theme)
    # 3. 底部绿地（仅 r=2 行的底部）
    if r == 2:
        # 块内 y = 5050 - r*CHUNK_H = 1050（当 r=2）；高 950
        draw_grass_block(draw, 0, 5050 - r * CHUNK_H, CHUNK_W, 950, theme)
    # 4. 左右边缘（c=0 左边缘，c=3 右边缘）
    if c == 0:
        edge_y_end = 5050 - r * CHUNK_H if r == 2 else CHUNK_H
        draw_building_block(draw, 0, 0, 520, edge_y_end, theme)
    if c == 3:
        edge_y_end = 5050 - r * CHUNK_H if r == 2 else CHUNK_H
        draw_building_block(draw, CHUNK_W - 520, 0, 520, edge_y_end, theme)

    # 5. 中间装饰物（按章节主题）
    wx0 = c * CHUNK_W  # 该块在世界坐标的 x 起点
    wy0 = r * CHUNK_H  # 该块在世界坐标的 y 起点
    # 装饰物在世界坐标的可走区域（520 < x < 9480, 1220 < y < 5280）
    # 转换为块内坐标
    deco_count = 8 if theme["deco"] != "anniv" else 6
    for _ in range(deco_count):
        # 块内坐标
        dx = random.randint(300, CHUNK_W - 300)
        dy = random.randint(300, CHUNK_H - 300)
        # 排除建筑/边缘区
        if r == 0 and dy < 1220:
            dy = random.randint(1300, CHUNK_H - 300)
        if r == 2 and dy > 5050 - r * CHUNK_H - 100:
            dy = random.randint(300, 5050 - r * CHUNK_H - 200)
        if c == 0 and dx < 520:
            dx = random.randint(600, CHUNK_W - 300)
        if c == 3 and dx > CHUNK_W - 520:
            dx = random.randint(300, CHUNK_W - 600)

        if theme["deco"] == "sakura":
            # 樱花树
            draw_sakura_tree(draw, dx, dy, scale=random.uniform(0.8, 1.3))
        elif theme["deco"] == "cyber":
            # 机柜
            draw_cyber_rack(draw, dx, dy, scale=random.uniform(0.7, 1.2))
            # 偶尔加屏幕
            if random.random() < 0.3:
                draw_cyber_rack(draw, dx + 150, dy + 20, scale=0.6)
        else:  # anniv
            # 纪念柱 + 彩旗
            if random.random() < 0.5:
                draw_anniv_pillar(draw, dx, dy, scale=random.uniform(0.8, 1.2))
            else:
                draw_flag(draw, dx, dy,
                          color=random.choice([(200, 16, 46), (255, 215, 0), (255, 105, 139)]))

    # 6. 中心块（r=1, c=1 或 c=2）加水池作为 landmark
    if r == 1 and c in (1, 2):
        cx, cy = CHUNK_W // 2, CHUNK_H // 2
        draw_water_pool(draw, cx, cy, 600, 400, theme)

    # 7. 整体轻微模糊（柔化噪点）
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))

    return img


def generate_obstacles(theme_name):
    """生成与 ch1 同结构的障碍物配置（建筑/边缘/绿地/水池/灯柱/装饰）"""
    if theme_name == "ch2-sakura":
        # 樱花季：实验室 + 樱花树丛
        return [
            {"type": "building", "x": 0, "y": 0, "w": WORLD_W, "h": 1180},
            {"type": "edge", "x": 0, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 9240, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 0, "y": 5050, "w": WORLD_W, "h": 950},
            {"type": "green", "x": 760, "y": 1180, "w": 470, "h": 3600},
            {"type": "green", "x": 8770, "y": 1180, "w": 470, "h": 3600},
            {"type": "water", "x": 2840, "y": 2470, "w": 320, "h": 1120},
            {"type": "water", "x": 6840, "y": 2470, "w": 320, "h": 1120},
            # 樱花树丛
            {"type": "tree", "x": 1500, "y": 1800, "w": 180, "h": 120},
            {"type": "tree", "x": 2200, "y": 2200, "w": 180, "h": 120},
            {"type": "tree", "x": 3500, "y": 1900, "w": 180, "h": 120},
            {"type": "tree", "x": 5500, "y": 2100, "w": 180, "h": 120},
            {"type": "tree", "x": 7200, "y": 1900, "w": 180, "h": 120},
            {"type": "tree", "x": 8500, "y": 2300, "w": 180, "h": 120},
            {"type": "tree", "x": 2000, "y": 3500, "w": 180, "h": 120},
            {"type": "tree", "x": 4000, "y": 3800, "w": 180, "h": 120},
            {"type": "tree", "x": 6000, "y": 3500, "w": 180, "h": 120},
            {"type": "tree", "x": 8000, "y": 3800, "w": 180, "h": 120},
            {"type": "tree", "x": 1500, "y": 4500, "w": 180, "h": 120},
            {"type": "tree", "x": 3500, "y": 4700, "w": 180, "h": 120},
            {"type": "tree", "x": 6500, "y": 4500, "w": 180, "h": 120},
            {"type": "tree", "x": 8500, "y": 4700, "w": 180, "h": 120},
            # 实验室桌椅
            {"type": "bench", "x": 3000, "y": 2200, "w": 200, "h": 80},
            {"type": "bench", "x": 6800, "y": 2200, "w": 200, "h": 80},
        ]
    elif theme_name == "ch3-cyber":
        # 智械危机：机房机柜
        return [
            {"type": "building", "x": 0, "y": 0, "w": WORLD_W, "h": 1180},
            {"type": "edge", "x": 0, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 9240, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 0, "y": 5050, "w": WORLD_W, "h": 950},
            {"type": "green", "x": 760, "y": 1180, "w": 470, "h": 3600},
            {"type": "green", "x": 8770, "y": 1180, "w": 470, "h": 3600},
            {"type": "water", "x": 2840, "y": 2470, "w": 320, "h": 1120},
            {"type": "water", "x": 6840, "y": 2470, "w": 320, "h": 1120},
            # 机柜群
            {"type": "rack", "x": 1500, "y": 1800, "w": 130, "h": 220},
            {"type": "rack", "x": 1700, "y": 1800, "w": 130, "h": 220},
            {"type": "rack", "x": 2200, "y": 2000, "w": 130, "h": 220},
            {"type": "rack", "x": 3500, "y": 1900, "w": 130, "h": 220},
            {"type": "rack", "x": 5500, "y": 2100, "w": 130, "h": 220},
            {"type": "rack", "x": 7200, "y": 1900, "w": 130, "h": 220},
            {"type": "rack", "x": 8500, "y": 2300, "w": 130, "h": 220},
            {"type": "rack", "x": 2000, "y": 3500, "w": 130, "h": 220},
            {"type": "rack", "x": 4000, "y": 3800, "w": 130, "h": 220},
            {"type": "rack", "x": 6000, "y": 3500, "w": 130, "h": 220},
            {"type": "rack", "x": 8000, "y": 3800, "w": 130, "h": 220},
            # 电缆堆
            {"type": "cable", "x": 3000, "y": 2200, "w": 200, "h": 80},
            {"type": "cable", "x": 6800, "y": 2200, "w": 200, "h": 80},
        ]
    else:  # ch4-anniv
        # 校庆：纪念柱 + 彩旗 + 喷泉
        return [
            {"type": "building", "x": 0, "y": 0, "w": WORLD_W, "h": 1180},
            {"type": "edge", "x": 0, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 9240, "y": 0, "w": 760, "h": WORLD_H},
            {"type": "edge", "x": 0, "y": 5050, "w": WORLD_W, "h": 950},
            {"type": "green", "x": 760, "y": 1180, "w": 470, "h": 3600},
            {"type": "green", "x": 8770, "y": 1180, "w": 470, "h": 3600},
            {"type": "water", "x": 2840, "y": 2470, "w": 320, "h": 1120},
            {"type": "water", "x": 6840, "y": 2470, "w": 320, "h": 1120},
            # 纪念柱
            {"type": "pillar", "x": 1500, "y": 1800, "w": 60, "h": 180},
            {"type": "pillar", "x": 2200, "y": 2200, "w": 60, "h": 180},
            {"type": "pillar", "x": 3500, "y": 1900, "w": 60, "h": 180},
            {"type": "pillar", "x": 5500, "y": 2100, "w": 60, "h": 180},
            {"type": "pillar", "x": 7200, "y": 1900, "w": 60, "h": 180},
            {"type": "pillar", "x": 8500, "y": 2300, "w": 60, "h": 180},
            {"type": "pillar", "x": 2000, "y": 3500, "w": 60, "h": 180},
            {"type": "pillar", "x": 4000, "y": 3800, "w": 60, "h": 180},
            {"type": "pillar", "x": 6000, "y": 3500, "w": 60, "h": 180},
            {"type": "pillar", "x": 8000, "y": 3800, "w": 60, "h": 180},
            # 彩旗
            {"type": "flag", "x": 3000, "y": 2200, "w": 60, "h": 130},
            {"type": "flag", "x": 6800, "y": 2200, "w": 60, "h": 130},
        ]


def generate_chapter(theme_name, theme):
    """生成单章节 12 块 + JSON 配置"""
    chunk_dir = os.path.join(OUT_ROOT, f"{theme_name}-layered-chunks")
    os.makedirs(chunk_dir, exist_ok=True)

    chunks = []
    for r in range(ROWS):
        for c in range(COLS):
            print(f"  Generating {theme_name} chunk-r{r}-c{c}...")
            img = generate_chunk(theme_name, theme, r, c)
            out_path = os.path.join(chunk_dir, f"chunk-r{r}-c{c}.png")
            img.save(out_path, "PNG", optimize=True)
            chunks.append({
                "key": f"{theme_name}-layered-map-r{r}-c{c}",
                "path": f"assets/maps/{theme_name}-layered-chunks/chunk-r{r}-c{c}.png",
                "x": c * CHUNK_W,
                "y": r * CHUNK_H,
            })

    config = {
        "name": theme["name"],
        "pixelWidth": WORLD_W,
        "pixelHeight": WORLD_H,
        "chunks": chunks,
        "spawn": {"x": WORLD_W // 2, "y": 3300},
        "camera": {"width": 960, "height": 540},
        "obstacles": generate_obstacles(theme_name),
    }

    json_path = os.path.join(OUT_ROOT, f"{theme_name}-layered.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f"  -> {json_path}")


def main():
    print(f"Output root: {OUT_ROOT}")
    os.makedirs(OUT_ROOT, exist_ok=True)
    for theme_name, theme in THEMES.items():
        print(f"\n=== Generating {theme_name} ({theme['name']}) ===")
        generate_chapter(theme_name, theme)
    print("\nAll maps generated successfully.")


if __name__ == "__main__":
    main()
