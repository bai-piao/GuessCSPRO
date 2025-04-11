import json
from bs4 import BeautifulSoup

def parse_html_table(input_file, output_file="players_data.json"):
    """
    从文件解析 HTML 表格数据并保存到 JSON 文件
    :param input_file: 输入的 HTML 文件名
    :param output_file: 输出的 JSON 文件名
    """
    try:
        # 从文件读取 HTML 内容
        with open(input_file, "r", encoding="utf-8") as f:
            html_content = f.read()

        # 使用 BeautifulSoup 解析 HTML
        soup = BeautifulSoup(html_content, "html.parser")
        table = soup.find("table")
        if not table:
            print("未找到表格，请检查 HTML 内容")
            return

        # 提取表头
        headers = [th.text.strip() for th in table.find("thead").find_all("th")]
        print(f"表头: {headers}")

        # 提取表格数据
        players_data = {}
        rows = table.find("tbody").find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) != len(headers):
                print("警告: 表格行中的单元格数量与表头不匹配，跳过该行")
                continue

            # 提取选手数据
            player_data = {headers[i]: cells[i].text.strip() for i in range(len(headers))}
            player_name = player_data.get("Player", "Unknown")
            player_link = row.find("a")["href"] if row.find("a") else "Unknown"
            if player_link != "Unknown":
                # 去掉 stats 并拼接完整链接
                player_link = f"https://www.hltv.org{player_link.replace('/stats', '').split('?')[0]}"
            player_data["link"] = player_link

            # 保存到字典
            players_data[player_name] = player_data
            print(f"已解析选手: {player_name}, 链接: {player_link}")

        # 保存到 JSON 文件
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(players_data, f, ensure_ascii=False, indent=4)
        print(f"数据已保存到 {output_file}")

    except Exception as e:
        print(f"解析过程中发生错误: {e}")

if __name__ == "__main__":
    input_file = input("请输入 HTML 文件路径: ").strip()
    parse_html_table(input_file)
