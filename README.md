Steps to clean data and run the simulation

1. Extract the columns listed in the report from the GPS and Ticketing data for the required time period into csv.
2. Select the route you want to map (note the code has been written only for buses that run a single route in a day). The corresponding ticket data has to be extracted (the route is defined by the first part of schedule number, split by /).
3. From the vehicles document find the device id of all the vehicles involved.
4. Pull the gps data of the corresponding device ids.
5. GPS device for each device id was stored in a seperate csv file
6. Run GPS_clean_data on GPS data for each file, consider only the tuples where Usable = 0
7. Run multiroutes to get a list of vehicle numbers that only run on one route for the entire day.
8. Run map_vehicles to map the vehicles of the particular route (that run only that route) to the device id.
9. Run Prepare_tickets to create seperate csv files for tickets purchased by each bus with a unique device id (note the device id is used as the name of the file for both ticketing and GPS data)
10. Ensure that the device ids in the ticketing and GPS data are the same (haven't written code for this)
11. Run bin_multi_files on all the files with GPS and ticketing data.
12. Run a simple CORS server by running the simple-cors-http-server python script from the directory with the data
13. The data is now ready to use for the simulation. Run init.html from the simulation folder on your browser (has been tested only on google chrome)