#!/usr/bin/env python
# coding: utf-8

# In[1]:


import modin.pandas as pd
#import pandas as pd
import geopy.distance as d
from datetime import datetime, timedelta
import numpy as np
from time import time, mktime
from matplotlib import pyplot as plt
import copy
import multiprocessing as mp


# In[2]:


route_number = '248'
'''
# Errors Raised:
# 0 - good
# 1 - Out of range of Bangalore
# 2 - Less than 3 satellites in view
# 3 - speed between two pings > 90kmph
# 4 - distance covered is non zero in zero time
# 5 - Only 1 or less reading from the device
# 6 - gps is more than 20 km away from a busstop
# 7 - latitude is not between -90 and 90
'''


# In[8]:


#bus stop data
busstops = pd.read_csv('../data/busstop_lat_long.csv')

def calc_dist(row):
    return d.distance((row['LAT'], row['LONGITUDE']), (row['prev_LAT'], row['prev_LONGITUDE'])).km

def error1(df):
    y = (df['LAT'] < 12) | (df['LAT'] > 14) | (df['LONGITUDE'] < 77) | (df['LONGITUDE'] > 78)
    df.Usable = df['Usable'].mask(y, 1)
    return df

def error2(df):
    df.Usable = df['Usable'].mask(df['NO_SATELLITE_IN_VIEW'] < 3, 2)
    return df

def error345(df):
    index_3 = []
    index_4 = []
    print('In 3', df.head())
    groups = [x for _, x in df.groupby('DEVICE_ID')]
    for x in groups:
        x = x[x['Usable'] == 0]
        if(len(x) <= 1):
            try:
                df.Usable = df['Usable'].mask(df.index.isin(x.index.values), 5)
            except:
                continue
        x['prev_LAT'] = x['LAT'].shift(1)
        x['prev_LONGITUDE'] = x['LONGITUDE'].shift(1)
        x = x.fillna(0)
        try:
            dist = x[['LAT', 'LONGITUDE', 'prev_LAT', 'prev_LONGITUDE']].apply(calc_dist, axis = 1)
            dist.columns = ['dist']
        except:
            print(x.head())
            continue
        dist_zeroes = (dist['dist'] == 0)
        timevals = pd.to_datetime(x['IST_DATE'], format='%Y-%m-%j %H:%M:%S')
        timevals = pd.Series(timevals).diff()
        timevals = timevals.fillna(pd.Timedelta(seconds=0))
        timevals = timevals / np.timedelta64(1, 'h')
        timevals.index = x.index
        time_zeroes = (timevals == 0)
        speed = dist['dist']/timevals
        speed = speed.replace(np.inf, -1)
        speed_zeroes = [speed > 90]
        a = (~np.array(dist_zeroes) & np.array(time_zeroes))
        
        index_4.extend(x.loc[a].index.values)
        index_3.extend(x.loc[speed_zeroes[0]].index.values)
    df.Usable = df['Usable'].mask(df.index.isin(index_3), 3)
    df.Usable = df['Usable'].mask(df.index.isin(index_4), 4)

    return df

def error6(df):
    '''
    Takes too long to run
    '''
    index_vals = []
    print('starting...')
    global busstops
    for ind, row in df.iterrows():
        flag = 0
        busstop_vals = busstops.loc[busstops['route_number'] == route_number]
        for _, row_bus in busstops.iterrows():
            if d.distance((row['LAT'], row['LONGITUDE']), (row_bus['latitude_current'], row_bus['longitude_current'])).km < 20:
                flag = 1
                break
        if flag == 0:
            index_vals.extend(ind)
    df.Usable = df['Usable'].mask(df.index.isin(index_vals), 6)
    return df

def error7(df):
    df.Usable = df['Usable'].mask(((df.LAT < -90) | (df.LAT > 90)).values, 7)
    return df


# In[9]:


def clean(df):
    '''Calls all the error cleaning functions'''
    df = error1(df)
    df = error2(df)
    df = error7(df)
    df = error345(df)
    #df = error6(df)
    return df


# In[10]:


def main():
    df = pd.read_csv('../new_data/gps_data/248.csv', encoding="ISO-8859-1")
    #df = df.reset_index(drop=True)
    df = df.assign(Usable=0)
    print(df.head())
    obj = clean(df)
    print(df.Usable.value_counts())
    df.to_csv('../new_data/gps_data/248_cleaned.csv')


# In[11]:


main()


# In[ ]:


busstops.loc[busstops['route_number'] == route_number]


# In[ ]:




