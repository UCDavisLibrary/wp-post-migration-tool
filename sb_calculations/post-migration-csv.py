import pandas as pd
import numpy as np
import json
from pandas.io.json import json_normalize
import math

def json_config(typedef, odf, givendf):
    df = pd.DataFrame()
    callnumber = "acf.ucdlib_" + typedef + "_call_num"
    givendf = givendf.drop(columns=['date'])
    # print(givendf.columns)
    # print(odf.columns)


    df = pd.merge(odf, givendf, how="left", left_on ='call_number', right_on = callnumber)
    # df = df[(df['type'] == "manuscript") | (df['type'] == "ua-collection")]
    # print(df.columns)

    return df

def arrayChange(x):
    if (x == ''):
        return x
    return x[0]

def jsonAdd(json_name, df, Tdf):
    odf = pd.DataFrame()
    oac = open('oac.json')
    o = json.load(oac)
    odf = odf.append(o, ignore_index=True)
    odf = odf[odf["call_number"].notnull()]
    odf["call_number"] = odf["call_number"].apply(arrayChange)
    odf = odf[odf["call_number"].isin(Tdf["call_number"])]


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


    if(json_name == "manuscript.json"):
        df = json_config("manuscript", odf, df)
    elif(json_name == "ua-collection.json"):
        df = json_config("uacollections", odf, df)


    return df    


if __name__ == '__main__':
    df1 = pd.DataFrame()
    df2 = pd.DataFrame()

    Td = pd.read_csv('ua_combined_call_number.csv')
    Tdf = Td[Td['add'] == 'T']

    dfMan = jsonAdd('manuscript.json', df1, Tdf)
    OdfM = dfMan[(dfMan['type'] != "manuscript")]
    dfMan = dfMan[(dfMan['type'] == "manuscript")]
    print(OdfM)

    dfCol = jsonAdd('ua-collection.json', df2, Tdf)
    OdfC = dfCol[(dfCol['type'] != "ua-collection")]
    dfCol = dfCol[(dfCol['type'] == "ua-collection")]
    print(OdfC)

    odf = pd.concat([OdfM, OdfC])
    results = pd.concat([dfMan, dfCol])


    dfMan.to_csv('manuscript_results.csv') #Just Manuscript Data
    dfCol.to_csv('ua_collection_results.csv') #Just UA data
    results.to_csv('result.csv') #Concat of both
    odf.to_csv('odf.csv') # Extra data without manuscript or ua details inside of it



    #result.to_csv('result.csv')
