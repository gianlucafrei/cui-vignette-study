import azure.functions as func
import logging
import json
import itertools
import random
import datetime
import time

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


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
            "question1": question1,
            "instance1": instance1,
            "v": vignette1,
            "s": s1
        },
        "second": {
            "question2": question2,
            "instance2": instance2,
            "v": vignette2,
            "s": s2
        }
    }
    return func.HttpResponse(json.dumps(output, sort_keys=True, indent=4))

@app.function_name(name="save_response")
@app.route(route="save_response", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_output(arg_name="outputDocument", database_name="trustcuistudy", container_name="responses", connection="CosmosDbConnectionSetting")
def save_response(req: func.HttpRequest,outputDocument: func.Out[func.Document], documents) -> func.HttpResponse:

    response = {}
    response["id"] = int(time.time() * 1000)
    response["experiment"] = req.params.get('experiment')
    response["instance1"] = req.params.get('instance1')
    response["instance2"] = req.params.get('instance2')
    response["vignette1"] = req.params.get('vignette1')
    response["vignette2"] = req.params.get('vignette2')
    response["selectedVignette"] = req.params.get('selectedVignette')
    response["participantId"] = req.params.get('participantId')
    response["time"] = datetime.datetime.now().isoformat()

    outputDocument.set(func.Document.from_dict(response))
    return func.HttpResponse(f"Created {response["id"]}!")

"""
# returns all example documents
@app.function_name(name="GetExamples")
@app.route(route="hello2", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_input(arg_name="documents", database_name="trustcuistudy", container_name="examples", connection="CosmosDbConnectionSetting")
def test_function2(req: func.HttpRequest, documents) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    logging.info('Python Cosmos DB trigger function processed a request.')

    result = []
    for doc in documents:
        result.append({"id": doc["id"]})

    return func.HttpResponse(json.dumps(result))


# Creates an example doucment
@app.function_name(name="CreateExample")
@app.route(route="hello", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_input(arg_name="documents", database_name="trustcuistudy", container_name="examples", connection="CosmosDbConnectionSetting")
@app.cosmos_db_output(arg_name="outputDocument", database_name="trustcuistudy", container_name="examples", connection="CosmosDbConnectionSetting")
def test_function(req: func.HttpRequest,outputDocument: func.Out[func.Document], documents) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    logging.info('Python Cosmos DB trigger function processed a request.')
    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name = req_body.get('name')

    if name:
        outputDocument.set(func.Document.from_dict({"id": name}))
        return func.HttpResponse(f"Hello {name}!")
    else:
        return func.HttpResponse(
                    "Please pass a name on the query string or in the request body",
                    status_code=400
                )"""