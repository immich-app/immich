from flask import Flask
import os

server = Flask(__name__)
is_dev = os.getenv('NODE_ENV') == 'development'


@server.route("/")
def hello():
    return "Immich Machine Learning!\n"


if __name__ == "__main__":
    server.run(debug=is_dev, host='0.0.0.0', port=5000)
