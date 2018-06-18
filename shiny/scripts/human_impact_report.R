# This script creates a pdf for each region in the Iberian peninsula with two plots for each of 
# its populations. The aim is to be able to detect anomalies which would lead to review the data
# entered when labeling historical land covers using historical orthophotographies.

library(gridExtra)
library(tidyr)
library(dplyr)
library(stringr)

results_dir <- jsonlite::fromJSON(paste(readLines("../../env/ws.json"), collapse=""))[['results_dir']]

# ad <- getArtificializationDegree()
# df <- getDataFromJSON()

# Artificialization degree data
getAD_data <- function(region.name){
  complete <- df %>% filter(label != '' & region == region.name) %>% group_by(acronym, year) %>% summarise(n=n()) %>% filter(n == 80) %>%
    dplyr::select(acronym, year) %>% ungroup()
  df.ad <- inner_join(complete, df, by=c("acronym", "year")) %>% dplyr::select(acronym, year, label) %>% rename("lc"="label")
  df.ad <- inner_join(df.ad, ad, by=c("lc"))
  df.ad.summary <- df.ad %>% group_by(acronym, year) %>% summarise(ad=sum(ad) / 800) %>% ungroup()
  df.ad.summary <- df.ad.summary %>%
    inner_join(getPopList(), by=c("acronym")) %>% mutate(acr.name = paste(toupper(acronym), "-", name)) %>%
    arrange(acr.name)
  return(df.ad.summary)
}

# Land cover change data
getLCC_data <- function(region.name){
  complete <- df %>% filter(label != '') %>% group_by(acronym, year) %>% summarise(n=n()) %>% filter(n == 80)
  dfg <- df %>% inner_join(complete, by=c("acronym", "year")) %>% mutate(label = gsub('\\+', '', label)) %>%
    group_by(region, acronym, year, label) %>% summarise(ha = length(label))
  df.lcc <- dfg %>% filter(region == region.name & label != '')
  if(dim(df.lcc)[1] == 0)
    return()
  df.lcc <- data.frame(df.lcc) %>% dplyr::select(acronym, label, year, ha, region) %>%
    mutate(year = as.numeric(year))
  df.lcc <- setCategoryLabels(df.lcc)
  df.lcc <- df.lcc %>% inner_join(getPopList(), by=c("acronym")) %>%
    mutate(acr.name = paste(toupper(acronym), "-", name)) %>% arrange(acr.name)
  return(df.lcc)
}

plotAD <- function(df.ad.region, acr){
  p <- ggplot(df.ad.region %>% filter(acronym == acr))
  p <- p + geom_line(aes(x=year, y=ad, colour=acronym, group=acronym))
  p <- p + xlab("") + ylab("Artificialization degree (0=least, 1=maximum)")
  p <- p + ylim(0,1)
  p <- p + theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.position = "none")
  p <- p + labs(subtitle=paste("weights:", paste(apply(ad[1:15,], 1, paste0, collapse=":"), collapse=", ")))
  
  return(p)  
}

plotLCC <- function(df.lcc.region, acr){
  p <- ggplot(df.lcc.region %>% filter(acronym == acr), aes(x=as.character(year), y=ha, fill=label)) 
  p <- p + geom_bar(stat='identity', position='fill')
  p <- p + scale_fill_manual("Land cover", values = c("Agriculture"="gold", "Bare soil"="Peru", "Dense forest"="Dark Green",
                                                      "Sparse forest"="Lime Green", "Dehesa"="Olive Drab",
                                                      "Infrastructures"="Slate Gray",
                                                      "Shrubs, herbs"="Orange",
                                                      "Urban"="Firebrick", "Water"="Dodger Blue"))
  p <- p + ylab("") + xlab("")
  p <- p + theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.position = "top")
  return(p)
}

regions <- unique(df$region)
for(region in regions){
  print(paste0("Processing ", region))
  df.ad.region <- getAD_data(region)
  df.lcc.region <- getLCC_data(region)
  acronyms <- unique(df.ad.region$acronym)
  plots_ad <- list()
  plots_lcc <- list()
  for(i in 1:length(acronyms)){
    print(paste0("Plotting ", acronyms[i]))
    plots_ad[[acronyms[[i]]]] <- plotAD(df.ad.region, acronyms[i])
    plots_lcc[[acronyms[[i]]]] <- plotLCC(df.lcc.region, acronyms[i])
  }
  pdf(paste0("../../outputs/", str_replace_all(Sys.Date(), '-', ''), "_", region, "-human_impact.pdf"), onefile = TRUE, width=15)
  for (i in seq(length(plots_ad))) {
    grid.arrange(plots_ad[[i]], plots_lcc[[i]], ncol=2, 
                 top = paste0(toupper(names(plots_ad)[i]), " - ", toupper(region)))
  }
  dev.off()
}






