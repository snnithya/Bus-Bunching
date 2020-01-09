#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import os
import numpy as np
import math


# In[ ]:


file_path_tickets = ""
file_path_vehicles = ""
file_path_mapped = ""
file_path_single_route = ""


# In[2]:


df = pd.read_csv(file_path_tickets)
veh = pd.read_csv(file_path_vehicles)


# In[4]:


#splitting schedule number into bus number (called route number in code) and trip number
x = df.schedule_no.str.split('/', 2, expand = True)


# In[5]:


x.drop_duplicates(inplace=True)


# In[6]:


x.columns = ['route_number', 'no_trips']
#x.to_csv('../new_data/no_of_trips.csv')


# In[7]:


#replace schedule number with just the bus number
df.schedule_no = x['route_number']


# In[8]:


routes = ['248']
path = file_path_mapped
single_route = pd.read_csv(file_path_single_route)


# In[10]:


#os.mkdir('..new_data/')
for r in routes:
    toremove = []
    print('{}'.format(path+r))
    #os.mkdir('{}'.format(path + r))
    v_no = df.loc[df.schedule_no == r, 'vehicle_no']
    d_no = []
    for v in v_no:
        x = veh.loc[veh.vehicle_no == v, 'device_id'].unique().tolist()
        if len(x) == 0:
            toremove.append(v)
        elif v not in set(single_route['vehicle_no']):
            toremove.append(v)
        elif x[0] != x[0]:
            #check for nan
            print(x[0])
            toremove.append(v)
        else:
            d_no.append(x[0])
    v = [v for v in v_no if v not in set(toremove)]
    pd.DataFrame({'Vehicle_no': v, 'Device_id': d_no}).to_csv(path+r+'/vd.csv')


# In[ ]:





# In[ ]:




