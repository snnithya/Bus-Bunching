#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd


# In[ ]:


file_path_tickets = ""


# In[2]:


tickets = pd.read_csv(file_path_tickets)


# In[3]:


#extract the route from schedule_no
tickets.schedule_no = tickets.schedule_no.str.split('/', expand = True)[0]


# In[4]:


#list of vehicle numbers with one route acc to ticket data
routes = []
for v in tickets.vehicle_no.unique():
    if(len(tickets.loc[tickets.vehicle_no == v].schedule_no.value_counts()) == 1):
        routes.append(v)


# In[5]:


#list of vehicle number with more than one route
multi_routes = list(set(tickets.vehicle_no.unique()) - set(routes))


# In[6]:


#map with device ids
pd.DataFrame({'vehicle_no': routes}).to_csv('../data/usable_single_route.csv')


# In[ ]:




