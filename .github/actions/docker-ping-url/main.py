import os
import requests
import time
def pingUrl(url, delay, max_trails):
    trials = 0
    while trials < max_trails:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"website {url} is reachable")
                return True
        except requests.ConnectionError:
            print(f"{url} is unreachable. Retrying in {delay} seconds")
            time.sleep(delay)
            trials += 1
        except requests.missingSchema:
            print(f"wrong schema {url}")
            return False

def run():
    print("Hello world")
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS","10"))

    website_reachable = pingUrl(website_url, delay, max_trials)

    if not website_reachable:
        raise Exception(f"website{website_url} is malformed or not reachable")
    
    print(f"website {website_url} is reachable")   

if __name__ == "__main__":
    run()