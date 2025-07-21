from flask import Flask, jsonify, request, make_response

app = Flask(__name__)

@app.route("/")
def index():
    return "Olá do servidor EC2!", 200

@app.route("/texto")
def texto():
    return "Resposta em texto simples", 200

@app.route("/json")
def json_endpoint():
    data = {"mensagem": "Esta é uma resposta JSON", "status": "ok"}
    return jsonify(data), 200

@app.route("/echo", methods=["POST"])
def echo():
    conteudo = request.json
    return jsonify(recebido=conteudo), 200

@app.route("/erro")
def erro():
    return make_response("Erro intencional", 500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)