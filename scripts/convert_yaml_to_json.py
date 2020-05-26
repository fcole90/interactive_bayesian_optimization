import yaml
import json
import os

current_dir = os.path.dirname(os.path.realpath(__file__))
config_dir = os.path.abspath(os.path.join(current_dir, os.path.pardir, "configurations"))


def main():
    for yaml_file_name in os.listdir(config_dir):
        if not yaml_file_name.endswith(".yaml"):
            continue
        with open(os.path.join(config_dir, yaml_file_name)) as yaml_file:
            yaml_dict = yaml.load(yaml_file, Loader=yaml.FullLoader)
            json_file_name = yaml_file_name.split(".")[0] + ".json"
        with open(os.path.join(config_dir, json_file_name), "w") as json_file:
            json.dump(yaml_dict, json_file)
        print(f"Converted {yaml_file_name} into {json_file_name}")


if __name__ == "__main__":
    main()