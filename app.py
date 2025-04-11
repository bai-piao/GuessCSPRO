from flask import Flask, jsonify, request, render_template
import json
import random

app = Flask(__name__)

# 加载清理后的选手数据
with open("players_data_cleaned.json", "r", encoding="utf-8") as f:
    players_data = json.load(f)

# 转换为列表格式以便前端使用
players_list = [
    {
        "name": player_name,
        "team": player_data.get("team", "Unknown"),
        "country": player_data.get("country", "Unknown"),
        "age": 2025 - player_data.get("birth_year", 2025) if player_data.get("birth_year") != "Unknown" else "Unknown",
        "role": player_data.get("role", "Unknown"),
        "majapp": player_data.get("majapp", 0),
    }
    for player_name, player_data in players_data.items()
]

# 随机选一个选手作为谜底
mystery_player = random.choice(players_list)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/players", methods=["GET"])
def get_players():
    query = request.args.get("q", "").lower()
    filtered_players = [
        player for player in players_list if query in player["name"].lower()
    ]
    return jsonify(filtered_players)


@app.route("/api/mystery", methods=["GET"])
def get_mystery_player():
    return jsonify({"name": mystery_player["name"]})


if __name__ == "__main__":
    app.run(debug=True)
