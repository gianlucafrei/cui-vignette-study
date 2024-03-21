import azure.functions as func
import logging
import json
import itertools
import random
import datetime
import time

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Get Experiment
@app.cosmos_db_input(arg_name="experiments", database_name="trustcuistudy", container_name="instances", connection="CosmosDbConnectionSetting", id="prestudy-test")
@app.route(route="get_experiment", auth_level=func.AuthLevel.ANONYMOUS)
def get_experiment(req: func.HttpRequest, experiments) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    experiment = experiments[0]
    experiment = json.loads(experiment.to_json())

    # Read the number of vignettes by reading the number of instances per statement
    num_statement = len(experiment["statements"])
    num_vignettes = len(experiment["statements"][0]["instances"])

    experiment["num_statement"] = num_statement
    experiment["num_vignettes"] = num_vignettes

    return func.HttpResponse(json.dumps(experiment, sort_keys=True, indent=4))

# Get Pair
@app.cosmos_db_input(arg_name="experiments", database_name="trustcuistudy", container_name="instances", connection="CosmosDbConnectionSetting", id="prestudy-test")
@app.route(route="get_pair", auth_level=func.AuthLevel.ANONYMOUS)
def get_pair(req: func.HttpRequest, experiments) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    experiment = experiments[0]
    experiment = json.loads(experiment.to_json())
    statements = experiment["statements"]
    
    # Read the number of vignettes by reading the number of instances per statement
    num_statement = len(statements)
    num_vignettes = len(statements[0]["instances"])

    statement_indexes = list(range(num_statement))
    vignettes_indexes = list(range(num_vignettes))

    # This needs to be improved to enable a more equal distribution
    s1, s2 = random.sample(statement_indexes, 2)
    v1, v2 = random.sample(vignettes_indexes, 2)

    # Load the two statements
    instance1 = statements[s1]["instances"][v1]["instance"]
    instance2 = statements[s2]["instances"][v2]["instance"]
    vignette1 = statements[s1]["instances"][v1]["vignette"]
    vignette2 = statements[s2]["instances"][v2]["vignette"]
    question1 = statements[s1]["question"]
    question2 = statements[s2]["question"]

    # Create Output
    output = {
        "first": {
            "question": question1,
            "instance": instance1,
            "v": vignette1,
            "s": s1
        },
        "second": {
            "question": question2,
            "instance": instance2,
            "v": vignette2,
            "s": s2
        },
        "redirectUrl": experiment["redirectUrl"],
        "totalQuestions": experiment["totalQuestions"],
    }
    return func.HttpResponse(json.dumps(output, sort_keys=True, indent=4))

# Save Response
@app.function_name(name="save_response")
@app.route(route="save_response", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_output(arg_name="outputDocument", database_name="trustcuistudy", container_name="responses", connection="CosmosDbConnectionSetting")
def save_response(req: func.HttpRequest,outputDocument: func.Out[func.Document]) -> func.HttpResponse:

    response = {}
    response["id"] = str(int(time.time() * 1000))
    response["time"] = datetime.datetime.now().isoformat()

    for key in req.params.keys():
        response[key] = req.params.get(key)
        
    outputDocument.set(func.Document.from_dict(response))
    logging.info(outputDocument)
    return func.HttpResponse(f"Created {response['id']}!")


# Get All Responses
@app.function_name(name="get_responses")
@app.route(route="get_responses", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_input(arg_name="documents", database_name="trustcuistudy", container_name="responses", connection="CosmosDbConnectionSetting")
def get_responses(req: func.HttpRequest, documents) -> func.HttpResponse:

    result = [json.loads(d.to_json()) for d in documents]
    return func.HttpResponse(json.dumps(result, sort_keys=True, indent=4))
