#!/usr/bin/env python
# coding: utf-8

# In[4]:


import pandas as pd


# In[5]:


tickets = pd.read_csv('../data/JAN1_SALES.csv')
vd = pd.read_csv('../new_data/vehicle_no/248/vd.csv')


# In[6]:


for v in vd.iterrows():
    did = v[1]['Device_id']
    (tickets[tickets['vehicle_no'] == v[1]['Vehicle_no']]).to_csv('../new_data/ticket_data/' + str(did) + '.csv')


# In[ ]:




