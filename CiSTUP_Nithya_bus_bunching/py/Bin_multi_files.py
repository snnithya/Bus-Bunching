#!/usr/bin/env python
# coding: utf-8

# In[8]:


import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from scipy import stats


# In[9]:


path_t = '../new_data/ticket_data'
new_path_t = '../new_data/ticket_bin_data'
path_g = '../new_data/gps_data/248'
new_path_g = '../new_data/gps_bin_data'


# In[10]:


def find_mode(x):
    #print(x)
    if len(x) == 0:
        return pd.DataFrame({'time_bins': x.index, 'trip_no': np.nan, 'route_direction': np.nan})
    else:
        
        return (x.mode()[:1])
        #print((x.mode()['trip_no'][0]))
        #return x.mode()[0]


# In[11]:


for file in os.listdir(path_t):
    if file in ['.DS_Store', '150221542.csv', '150222824.csv', '150221806.csv', '150221685.csv', '150218358.csv', 
                '150814778.csv', '150218031.csv']:
        continue
    print(file)
    tickets = pd.read_csv(os.path.join(path_t, file))
    new_date = []
    for x in list(zip(tickets.ticket_date, tickets.ticket_time)):
        new_date.append(x[0] + ' ' + x[1])
    tickets.ticket_time = pd.to_datetime(new_date, infer_datetime_format=True)
    bins = [datetime(2018, 1, 1, 0, 0, 0) + timedelta(seconds = x) for x in range(0, 86410, 10)]
    labels = [x for x in range(0, 86400, 10)]
    time_bins = pd.Series(pd.cut(tickets.ticket_time, bins = bins, labels = labels))
    tickets['time_bins'] = time_bins
    tickets['route_direction'] = pd.Series(tickets['route_no'].apply(lambda x: 'UP' if 'UP' in x else 'DN'))
    temp_directions = tickets[['time_bins', 'trip_no', 'route_direction']].groupby('time_bins', sort = True).apply(find_mode)
    map_vals = tickets.groupby(by = 'time_bins').agg({'total_ticket_amount': sum, 'px_count': sum})
    #map_vals.set_index('time_bins', inplace = True)
    temp_directions.set_index('time_bins', inplace = True)
    #print(temp_directions)
    map_vals['trip_no'] = temp_directions['trip_no']
    map_vals['route_direction'] = temp_directions['route_direction']
    map_vals = map_vals.fillna(method = 'ffill')
    map_vals = map_vals.fillna('NA')
    #print(map_vals)
    map_vals.to_csv(os.path.join(new_path_t, file))
    


# In[15]:


for file in os.listdir(path_g):
    if file == '.DS_Store':
        continue
    gps = pd.read_csv(os.path.join(path_g, file))
    print(gps.columns)
    dates_gps = pd.to_datetime(gps.loc[:, 'IST_DATE'], infer_datetime_format=True)
    map_vals_gps = gps.loc[:,['LAT', 'LONGITUDE']]
    bins = [datetime(2018, 1, 1, 0, 0, 0) + timedelta(seconds = x) for x in range(0, 86410, 10)]
    labels = [x for x in range(0, 86400, 10)]
    time_bins = pd.cut(dates_gps, bins = bins, labels = labels)
    map_vals_gps['time_bins'] = time_bins
    map_vals_gps = map_vals_gps.groupby(by = 'time_bins', axis = 0, sort = True).mean()
    direction = (pd.read_csv(new_path_t + '/' + file)['route_direction'].unique())
    if direction[1] == 'UP':
        map_vals_gps.LAT = map_vals_gps.LAT.fillna(method='ffill').fillna(12.956759)
        map_vals_gps.LONGITUDE = map_vals_gps.LONGITUDE.fillna(method = 'ffill').fillna(value = 77.573600) 
    else:
        map_vals_gps.LAT = map_vals_gps.LAT.fillna(method='ffill').fillna(13.039549)
        map_vals_gps.LONGITUDE = map_vals_gps.LONGITUDE.fillna(method = 'ffill').fillna(value = 77.518198)
    map_vals_gps.to_csv(os.path.join(new_path_g, file))
    
    
    


# In[ ]:





# In[ ]:




