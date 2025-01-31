from views.server.app import app
import os

if __name__ == "__main__":
    # print(os.environ.get("MONGODB_URL"))
    app.run(debug=True, port=int(os.getenv('CORE_PORT', 7000)), host='0.0.0.0')