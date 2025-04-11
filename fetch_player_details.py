import json
import time
import random
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def fetch_player_details(input_file="players_data.json", output_file="players_data.json"):
    """
    从 JSON 文件读取选手数据，通过浏览器模拟法获取详细信息，并保存更新后的数据
    :param input_file: 输入的 JSON 文件名
    :param output_file: 输出的 JSON 文件名
    """
    try:
        # 加载选手数据
        with open(input_file, "r", encoding="utf-8") as f:
            players_data = json.load(f)

        # 初始化浏览器
        options = uc.ChromeOptions()
        # 移除 '--headless' 参数，启用可视化模式
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-blink-features=AutomationControlled')
        driver = uc.Chrome(options=options)

        try:
            for idx, (player_name, player_data) in enumerate(players_data.items(), 1):
                if "country" in player_data and "team" in player_data and "birth_year" in player_data:
                    print(f"跳过已更新的选手: {player_name}")
                    continue

                retries = 0
                max_retries = 3
                while retries < max_retries:
                    try:
                        print(f"正在获取选手 {player_name} 的详细信息 ({idx}/{len(players_data)})...")
                        driver.get(player_data["link"])

                        # 等待页面加载
                        wait = WebDriverWait(driver, 8)

                        # 获取国籍
                        try:
                            country_element = wait.until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, "div.playerRealname img.flag"))
                            )
                            country = country_element.get_attribute("alt").strip()  # 从 img 的 alt 属性获取国籍
                        except:
                            country = "Unknown"
                            print(f"未找到选手 {player_name} 的国籍信息")

                        # 获取队伍
                        try:
                            team_element = wait.until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, "div.playerTeam span.listRight span[itemprop='text']"))
                            )
                            team = team_element.text.strip()
                        except:
                            team = "No team"
                            print(f"未找到选手 {player_name} 的队伍信息")

                        # 获取年龄并计算出生年份
                        try:
                            age_element = wait.until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, "div.playerAge span.listRight span[itemprop='text']"))
                            )
                            age = int(age_element.text.strip().split()[0])  # 提取年龄数字
                            birth_year = 2025 - age  # 假设当前年份为 2023
                        except:
                            age = "Unknown"
                            birth_year = "Unknown"
                            print(f"未找到选手 {player_name} 的年龄信息")

                        # 获取角色 (role)
                        try:
                            sniping_element = wait.until(
                                EC.presence_of_element_located((By.XPATH, "//div[@class='player-stat' and .//b[text()='Sniping']]//span[@class='statsVal']//b"))
                            )
                            sniping_score = int(sniping_element.text.strip())
                            role = "AWPer" if sniping_score > 60 else "Rifler"
                        except:
                            # 如果在当前页面未找到角色数据，尝试从 stats 页面获取
                            print(f"未找到选手 {player_name} 的 Sniping 数据，尝试从 stats 页面获取...")
                            try:
                                # 构造 stats 页面 URL
                                stats_url = player_data["link"].replace("/player/", "/stats/players/")
                                driver.get(stats_url)

                                # 等待 stats 页面加载
                                stats_wait = WebDriverWait(driver, 8)
                                stats_sniping_element = stats_wait.until(
                                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.role-stats-section.role-sniping div.row-stats-section-score"))
                                )
                                sniping_score = int(stats_sniping_element.text.strip().split("/")[0])  # 提取 Sniping 分数
                                role = "AWPer" if sniping_score > 60 else "Rifler"
                                print(f"从 stats 页面获取到 Sniping 数据: {sniping_score}")
                            except:
                                role = "Unknown"
                                print(f"在 stats 页面也未找到选手 {player_name} 的 Sniping 数据")

                        # 更新选手数据
                        player_data["country"] = country
                        player_data["team"] = team
                        player_data["birth_year"] = birth_year
                        player_data["role"] = role
                        print(f"已更新选手: {player_name}, 国籍: {country}, 队伍: {team}, 出生年: {birth_year}, 角色: {role}")

                        # 随机延迟以避免被检测为机器人
                        time.sleep(random.uniform(1.0, 2.0))
                        break  # 成功后跳出重试循环

                    except Exception as e:
                        retries += 1
                        print(f"获取选手 {player_name} 详细信息时出错: {e}")
                        if retries < max_retries:
                            wait_time = retries * 5
                            print(f"等待 {wait_time} 秒后重试... ({retries}/{max_retries})")
                            time.sleep(wait_time)
                        else:
                            print(f"已达到最大重试次数，跳过选手 {player_name}")

                # 每处理五个选手保存一次数据
                if idx % 5 == 0:
                    with open(output_file, "w", encoding="utf-8") as f:
                        json.dump(players_data, f, ensure_ascii=False, indent=4)
                    print(f"已保存中间数据到 {output_file}，已处理 {idx}/{len(players_data)} 名选手")

            # 保存最终更新后的数据
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(players_data, f, ensure_ascii=False, indent=4)
            print(f"所有选手数据已更新并保存到 {output_file}")

        finally:
            driver.quit()

    except Exception as e:
        print(f"获取选手详细信息过程中发生错误: {e}")

def clean_player_data(input_file="players_data.json", output_file="players_data_cleaned.json"):
    """
    清理选手数据文件，删除除 player, link, country, team, birth_year, role 以外的字段
    :param input_file: 输入的 JSON 文件名
    :param output_file: 输出的清理后的 JSON 文件名
    """
    try:
        # 加载选手数据
        with open(input_file, "r", encoding="utf-8") as f:
            players_data = json.load(f)

        # 保留的字段
        allowed_keys = {"Player", "link", "country", "team", "birth_year", "role"}

        # 清理数据
        cleaned_data = {}
        for player_name, player_data in players_data.items():
            cleaned_data[player_name] = {key: value for key, value in player_data.items() if key in allowed_keys}

        # 保存清理后的数据
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=4)
        print(f"清理后的数据已保存到 {output_file}")

    except Exception as e:
        print(f"清理数据过程中发生错误: {e}")

def fetch_major_appearances(input_file="players_data_cleaned.json", output_file="players_data_cleaned.json"):
    """
    获取选手的 Major 参赛次数 (majapp) 并更新到数据中
    :param input_file: 输入的 JSON 文件名
    :param output_file: 输出的 JSON 文件名
    """
    try:
        # 加载选手数据
        with open(input_file, "r", encoding="utf-8") as f:
            players_data = json.load(f)

        # 初始化浏览器
        options = uc.ChromeOptions()
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-blink-features=AutomationControlled')
        driver = uc.Chrome(options=options)

        try:
            for idx, (player_name, player_data) in enumerate(players_data.items(), 1):
                if "majapp" in player_data:
                    print(f"跳过已更新的选手: {player_name}")
                    continue

                retries = 0
                max_retries = 3
                while retries < max_retries:
                    try:
                        print(f"正在获取选手 {player_name} 的 Major 次数 ({idx}/{len(players_data)})...")
                        driver.get(f"{player_data['link']}#tab-achievementBox")

                        # 等待页面加载
                        wait = WebDriverWait(driver, 8)

                        # 获取 Major 次数
                        try:
                            majors_played_element = wait.until(
                                EC.presence_of_element_located((By.XPATH, "//div[@class='highlighted-stat' and .//div[text()='Majors played']]//div[@class='stat']"))
                            )
                            majors_played = int(majors_played_element.text.strip())
                        except:
                            majors_played = 0
                            print(f"未找到选手 {player_name} 的 Major 次数信息")

                        # 更新选手数据
                        player_data["majapp"] = majors_played
                        print(f"已更新选手: {player_name}, Major 次数: {majors_played}")

                        # 随机延迟以避免被检测为机器人
                        time.sleep(random.uniform(1.0, 2.0))
                        break  # 成功后跳出重试循环

                    except Exception as e:
                        retries += 1
                        print(f"获取选手 {player_name} 的 Major 次数时出错: {e}")
                        if retries < max_retries:
                            wait_time = retries * 5
                            print(f"等待 {wait_time} 秒后重试... ({retries}/{max_retries})")
                            time.sleep(wait_time)
                        else:
                            print(f"已达到最大重试次数，跳过选手 {player_name}")

                # 每处理五个选手保存一次数据
                if idx % 5 == 0:
                    with open(output_file, "w", encoding="utf-8") as f:
                        json.dump(players_data, f, ensure_ascii=False, indent=4)
                    print(f"已保存中间数据到 {output_file}，已处理 {idx}/{len(players_data)} 名选手")

            # 保存最终更新后的数据
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(players_data, f, ensure_ascii=False, indent=4)
            print(f"所有选手的 Major 次数已更新并保存到 {output_file}")

        finally:
            driver.quit()

    except Exception as e:
        print(f"获取 Major 次数过程中发生错误: {e}")

def main():
    """
    主函数，提供从头开始获取、继续获取或获取 Major 次数的选项
    """
    print("请选择操作：")
    print("1. 从头开始获取选手数据")
    print("2. 继续获取未完成的选手数据")
    print("3. 获取选手的 Major 次数")
    choice = input("请输入选项（1、2 或 3）: ").strip()

    if choice == "1":
        print("清理数据并从头开始获取...")
        clean_player_data()  # 清理数据
        fetch_player_details()  # 从头开始获取
    elif choice == "2":
        print("继续获取未完成的选手数据...")
        fetch_player_details()  # 继续获取
    elif choice == "3":
        print("获取选手的 Major 次数...")
        fetch_major_appearances()  # 获取 Major 次数
    else:
        print("无效的选项，请重新运行程序并选择 1、2 或 3。")

if __name__ == "__main__":
    main()
