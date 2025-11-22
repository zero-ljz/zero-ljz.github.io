import os
import json
import time
from datetime import datetime

def generate_index(folder_path, output_file, extensions):
    if not os.path.exists(folder_path):
        print(f"目录不存在: {folder_path}")
        return

    files_data = []
    
    # 遍历目录
    with os.scandir(folder_path) as entries:
        for entry in entries:
            if entry.is_file() and entry.name.lower().endswith(tuple(extensions)):
                # 获取文件修改时间
                stat = entry.stat()
                mod_time = datetime.fromtimestamp(stat.st_mtime)
                
                files_data.append({
                    "name": entry.name,
                    "path": f"./{folder_path}/{entry.name}",
                    # 格式化时间: 2025-11-22 16:30
                    "date": mod_time.strftime("%Y-%m-%d %H:%M"),
                    "timestamp": stat.st_mtime # 用于排序
                })

    # 按时间倒序排序 (最新的在前面)
    files_data.sort(key=lambda x: x['timestamp'], reverse=True)

    # 移除 timestamp 字段，减少 JSON 体积 (前端只需要格式化后的 date)
    for item in files_data:
        del item['timestamp']

    # 写入 JSON
    output_path = os.path.join(folder_path, output_file)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(files_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已生成 {output_path}，共 {len(files_data)} 个文件")

# --- 执行配置 ---

# 1. 处理图片 (Photos)
generate_index(
    folder_path="photos", 
    output_file="index.json", 
    extensions=[".jpg", ".jpeg", ".png", ".gif", ".webp"]
)

# 2. 处理文章 (Posts)
generate_index(
    folder_path="posts", 
    output_file="index.json", 
    extensions=[".md"]
)