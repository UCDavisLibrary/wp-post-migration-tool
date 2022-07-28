import pandas as pd
import numpy as np
import json
from pandas.io.json import json_normalize
import math

def json_config(typedef, odf, givendf, method):
    df = pd.DataFrame()
    callnumber = "acf.ucdlib_" + typedef + "_call_num"
    givendf = givendf.drop(columns=['date'])

    if(method == "A"):
        df = pd.merge(odf, givendf, how="outer", left_on ='call_number', right_on = callnumber)
    elif(method == "B"):
        df = pd.concat([odf, givendf], axis=1)

    return df

def arrayChange(x):
    separator = ';'
    if (x == ''):
        return x
    if(len(x) != 1):
        return separator.join(x)

    return x[0]


def jsonAdd(json_name, df, Tdf, method):
    odf = pd.DataFrame()
    oac = open('oac.json')
    o = json.load(oac)
    odf = odf.append(o, ignore_index=True)
    odf = odf[odf["call_number"].notnull()]
    odf["call_number"] = odf["call_number"].apply(arrayChange)
    odf = odf[odf["call_number"].isin(Tdf["call_number"])]
    odf = pd.merge(odf, Tdf, on ='call_number')


    f = open(json_name)
    d = json.load(f)

    if(json_name != "oac.json"):
        for i in d:
            dN = pd.json_normalize(i, max_level=2)
            df = df.append(dN, ignore_index=True)


    if(json_name == "manuscript.json"):
        df = df[df["acf.ucdlib_manuscript_call_num"].isin(Tdf["call_number"])]
    elif(json_name == "ua-collection.json"):
        df = df[df["acf.ucdlib_uacollections_call_num"].isin(Tdf["call_number"])]

    if(method == "A"):
        if(json_name == "manuscript.json"):
            df = json_config("manuscript", odf, df, "A")
        elif(json_name == "ua-collection.json"):
            df = json_config("uacollections", odf, df, "A")
    elif(method == "B"):
        if(json_name == "manuscript.json"):
            df = json_config("manuscript", odf, df, "B")
        elif(json_name == "ua-collection.json"):
            df = json_config("uacollections", odf, df, "B")



    return df    


if __name__ == '__main__':
    df1 = pd.DataFrame()
    df2 = pd.DataFrame()

    Td = pd.read_csv('ua_combined_call_number.csv')
    Tdf = Td[Td['add'] == 'T']


    dfMan = jsonAdd('manuscript.json', df1, Tdf, "A")
    OdfM = dfMan[(dfMan['type'] != "manuscript")]
    dfMan = dfMan[(dfMan['type'] == "manuscript")]

    dfCol = jsonAdd('ua-collection.json', df2, Tdf, "A")
    OdfC = dfCol[(dfCol['type'] != "ua-collection")]
    dfCol = dfCol[(dfCol['type'] == "ua-collection")]

    odf = pd.concat([OdfM, OdfC])
    results = pd.concat([dfMan, dfCol])

    odf = odf[~odf["call_number"].isin(results["call_number"])]
    odf = odf.drop_duplicates()



    results = pd.concat([odf, results])


    values = {
    "D-009": None,
    "D-088": "990004126190403126",
    "D-193": None,
    "D-210": None,
    "MC 256" : None,
    "MC029": None,
    "MC030": None,
    "MC033": None,
    "MC034": None,
    "MC043": None,
    "MC044": None,
    "MC048": None,
    "MC051": None,
    "MC058": None,
    "MC064": "990003165320403126",
    "MC069": None,
    "MC071": None,
    "MC076": None,
    "MC077": None,
    "MC083": None,
    "MC084": None,
    "MC086": None,
    "MC088": None,
    "MC089": None,
    "MC098": None,
    "MC102": None,
    "MC104": None,
    "MC110": None,
    "MC115": None,
    "MC120": None,
    "MC121": None,
    "MC129": None,
    "MC157": "990030494290403126",
    "MC163": None,
    "MC236": "990033278730403126",
    "MC245": "990035737060403126",
    "MC263": "990036730020403126",
    "MC281": "9981105159503126",
    "O-013": None,
    "O-017": None,
    "O-019": None,
    "O-021": None,
    "O-023": None,
    "O-024": "990005348040403126",
    "O-025": "990005348050403126",
    "O-027": None,
    "O-028": None,
    "O-030": "990003327440403126",
    "O-032": None,
    "O-033": None,
    "O-035": None,
    "O-037": None,
    "O-040": "990003327410403126",
    "AR-001": "9980991648903126",
    "AR-058" : "9981078857303126",
    "AR-108" : "9981189555603126"}
    for key, value in values.items():
        results.loc[results["acf.ucdlib_manuscript_call_num"] == key, "recordid"] = value
        results.loc[results["acf.ucdlib_uacollections_call_num"] == key, "recordid"] = value


    results = results.drop(["New", "add", "record", "JSON", "Linked Data", "lib", "lib.1", "lib-ua-collection", "lib-manuscript", "oac-archives", "oac-collections"], axis=1)
    dfMan.to_csv('manuscript_results.csv') #Just Manuscript Data
    dfCol.to_csv('ua_collection_results.csv') #Just UA data
    results.to_csv('result.csv') #Concat of both


    odf.to_csv('odf.csv') # Extra data without manuscript or ua details inside of it



    #result.to_csv('result.csv')
