# Learning Rates Data Sources

This document lists the public data sources used for the energy technology learning curves visualization.

## Solar PV
- **Source**: IRENA Renewable Power Generation Costs reports (2010-2021)
- **URL**: https://www.irena.org/publications/2021/Jun/Renewable-Power-Costs-in-2020
- **Data**: Global weighted-average LCOE for utility-scale solar PV installations
- **Capacity**: IRENA Global Renewable Energy Statistics

## Solar Concentrated (CSP)
- **Source**: IRENA Renewable Power Generation Costs reports (2010-2021)
- **URL**: https://www.irena.org/publications/2021/Jun/Renewable-Power-Costs-in-2020
- **Data**: Global weighted-average LCOE for CSP installations
- **Capacity**: IRENA Global Renewable Energy Statistics

## Onshore Wind
- **Source**: IRENA Renewable Power Generation Costs reports (2010-2021)
- **URL**: https://www.irena.org/publications/2021/Jun/Renewable-Power-Costs-in-2020
- **Data**: Global weighted-average LCOE for onshore wind installations
- **Capacity**: IRENA Global Renewable Energy Statistics

## Offshore Wind
- **Source**: IRENA Renewable Power Generation Costs reports (2010-2021)
- **URL**: https://www.irena.org/publications/2021/Jun/Renewable-Power-Costs-in-2020
- **Data**: Global weighted-average LCOE for offshore wind installations
- **Capacity**: IRENA Global Renewable Energy Statistics

## Lithium-ion Batteries
- **Source**: BloombergNEF Battery Pack Prices
- **URL**: https://about.bnef.com/blog/battery-pack-prices-cited-below-100-kwh-for-the-first-time-in-2020/
- **Data**: Volume-weighted average battery pack prices ($/kWh converted to $/MWh for energy storage)
- **Capacity**: Global cumulative installed battery storage capacity from BNEF

## Lithium Iron Phosphate (LFP)
- **Source**: BloombergNEF Battery Technology reports
- **URL**: https://about.bnef.com/
- **Data**: LFP battery pack prices and deployment data
- **Capacity**: Cumulative LFP installations globally

## Sodium-ion Batteries
- **Source**: Industry reports and research publications
- **URL**: Various academic and industry sources
- **Data**: Early commercial sodium-ion battery costs (emerging technology)
- **Capacity**: Limited early deployments (2018-2020)

## Nuclear
- **Source**: IAEA PRIS Database and Lazard LCOE Analysis
- **URL**: https://pris.iaea.org/ and https://www.lazard.com/
- **Data**: Levelized cost of new nuclear power plants
- **Capacity**: IAEA nuclear capacity statistics

## Coal
- **Source**: Lazard LCOE Analysis and IEA reports
- **URL**: https://www.lazard.com/ and https://www.iea.org/
- **Data**: Levelized cost of coal power generation
- **Capacity**: Global Energy Monitor coal capacity tracking

## Natural Gas
- **Source**: Lazard LCOE Analysis and EIA reports
- **URL**: https://www.lazard.com/ and https://www.eia.gov/
- **Data**: Levelized cost of natural gas combined cycle plants
- **Capacity**: Global natural gas power generation capacity

## Oil
- **Source**: Lazard LCOE Analysis and industry reports
- **URL**: https://www.lazard.com/
- **Data**: Levelized cost of oil-fired power generation
- **Capacity**: Global oil-fired power generation capacity

## Notes

1. All costs are adjusted for inflation to 2020 USD
2. Costs represent global weighted averages where available
3. Learning rates are calculated from the fitted trend lines in log-log space
4. The formula used is: Learning Rate = (1 - 2^slope) × 100%
5. Capacity data represents cumulative global installed capacity in megawatts

## Methodology

Data points were selected to represent meaningful observations across the learning curve for each technology. Where annual data was not available, biennial or other intervals were used to ensure adequate representation of the cost-capacity relationship while maintaining data quality.
