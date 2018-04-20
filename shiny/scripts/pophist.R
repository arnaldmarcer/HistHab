library(jsonlite)
library(dplyr)
library(tidyr)
library(readxl)
library(ggplot2)
library(stringr)
library(magrittr)

results_dir <- jsonlite::fromJSON(paste(readLines("../../env/ws.json"), collapse=""))[['results_dir']]

getDataFromJSON <- function(){
    pop.list <- getPopList()
    df.res <- data_frame()
    for(i in 1:dim(pop.list)[1]){
        pop <- pop.list[i,]
        json_file <- paste(results_dir, "/", pop$region, "/", pop$acronym, ".json", sep="")
        if(file.exists(json_file)){
            # print(json_file)
            json_data <- jsonlite::fromJSON(paste(readLines(json_file), collapse=""))
            json_data <- json_data$grid
            json_data$acronym <- pop$acronym
            json_data$region <- pop$region
            df.res <- bind_rows(df.res, json_data)
        }
    }
    return(df.res)
}

getPopList <- function(){
    f.xls <- jsonlite::fromJSON(paste(readLines("../../env/ws.json"), collapse=""))[['xls_pop_file']]
    sheet_name <- jsonlite::fromJSON(paste(readLines("../../env/ws.json"), collapse=""))[['xls_pop_sheet_name']]
    pops <- read_excel(f.xls, sheet_name) %>% mutate(acronym=tolower(acronym))
    return(pops)
}

getDataStatus <- function(){
    df.res <- getDataFromJSON()

    df.res <- df.res %>% dplyr::select(acronym, year, xc, yc, label)
    df.res.summary <- df.res %>% mutate(label=ifelse(label=="", 0, 1)) %>% group_by(acronym, year) %>%
        summarise(n.res=sum(label))
    orthos.dir <- jsonlite::fromJSON(paste(readLines("../../env/ws.json"), collapse=""))[['data_dir']]
    orthos.dir <- paste0(orthos.dir, "/orthos")
    fs <- data.frame(f=cbind(list.files(orthos.dir, "jpg", recursive = T)))
    orthos.years <- fs %>% separate(f, c("region", "file"), "/") %>%
        separate(file, c("acronym","ortho", "year", "res", "ext"), "_") %>%
      dplyr::select(region, acronym, year) %>% mutate(n.orthos=0) %>% unique()

    orthos.years <- left_join(orthos.years, df.res.summary, by=c("acronym", "year"))
    orthos.years <- orthos.years %>% mutate(n.res=ifelse(is.na(n.res),0,n.res)) %>% mutate(n=n.res + n.orthos) %>%
      dplyr::select(region, acronym,year,n)

    df.summary <- orthos.years %>% spread(year, n)
    df.summary <- getPopList() %>% dplyr::select(acronym) %>% inner_join(df.summary, by=c("acronym"))
    df.summary[,3:dim(df.summary)[2]] <- apply(df.summary[,3:dim(df.summary)[2]], 2, function(x) as.integer(x))
    df.summary %<>% dplyr::select(region, acronym, names(df.summary)[3:dim(df.summary)[2]])
    return(df.summary)
}

setCategoryLabels <- function(df){
    df$label <- factor(df$label)
    levels(df$label)[levels(df$label)=="A"] <- "Agriculture"
    levels(df$label)[levels(df$label)=="B"] <- "Bare soil"
    levels(df$label)[levels(df$label)=="Fd"] <- "Dense forest"
    levels(df$label)[levels(df$label)=="Fs"] <- "Sparse forest"
    levels(df$label)[levels(df$label)=="D"] <- "Dehesa"
    levels(df$label)[levels(df$label)=="I"] <- "Infrastructures"
    levels(df$label)[levels(df$label)=="S"] <- "Shrubs, herbs"
    levels(df$label)[levels(df$label)=="U"] <- "Urban"
    levels(df$label)[levels(df$label)=="W"] <- "Water"
    return(df)
}

plotCoverChange <- function(region.name){
    df <- getDataFromJSON()
    complete <- df %>% filter(label != '') %>% group_by(acronym, year) %>% summarise(n=n()) %>% filter(n == 80)
    dfg <- df %>% inner_join(complete, by=c("acronym", "year")) %>% mutate(label = gsub('\\+', '', label)) %>% group_by(region, acronym, year, label) %>% summarise(ha = length(label))
    df.acr <- dfg %>% filter(region == region.name & label != '')
    if(dim(df.acr)[1] == 0)
        return()
    df.acr <- data.frame(df.acr) %>% dplyr::select(acronym, label, year, ha, region) %>% mutate(year = as.numeric(year))
    df.acr <- setCategoryLabels(df.acr)
    df.acr <- df.acr %>% inner_join(getPopList(), by=c("acronym")) %>% mutate(acr.name = paste(toupper(acronym), "-", name)) %>% arrange(acr.name)
    p <- ggplot(df.acr, aes(x=as.character(year), y=ha, fill=label)) + geom_bar(stat='identity', position='fill') +
        facet_wrap(~ acr.name, ncol=4)
    p <- p + scale_fill_manual("Land cover", values = c("Agriculture"="gold", "Bare soil"="Peru", "Dense forest"="Dark Green",
                                          "Sparse forest"="Lime Green", "Dehesa"="Olive Drab",
                                          "Infrastructures"="Slate Gray",
                                          "Shrubs, herbs"="Orange",
                                          "Urban"="Firebrick", "Water"="Dodger Blue"))
    p <- p + ylab("") + xlab("")
    p <- p + theme(axis.text.x = element_text(angle = 90, hjust = 1))
    return(p)
}

getArtificializationDegree <- function(){
    df <- data.frame(rbind(c("Fd", "1"), c("Fd+", "2"), c("B", "1"), c("B+", "2"), c("Fs", "3"), c("Fs+", "4"), c("S", "3"),
    c("S+", "4"), c("W", "5"), c("D", "6"), c("D+", "7"), c("A", "7"), c("A+", "8"), c("I", "9"), c("U", "10")))
    names(df) <- c("lc", "ad")
    df$lc <- as.character(df$lc)
    df$ad <- as.numeric(as.character(df$ad))
    return(df)
}

plotArticializationDegree <- function(region.name){
    ad <- getArtificializationDegree()
    df <- getDataFromJSON()
    complete <- df %>% filter(label != '' & region == region.name) %>% group_by(acronym, year) %>% summarise(n=n()) %>% filter(n == 80) %>%
        dplyr::select(acronym, year) %>% ungroup()
    df.lc <- inner_join(complete, df, by=c("acronym", "year")) %>% dplyr::select(acronym, year, label) %>% rename("lc"="label")
    df.lc <- inner_join(df.lc, ad, by=c("lc"))
    df.lc.summary <- df.lc %>% group_by(acronym, year) %>% summarise(ad=sum(ad) / 800) %>% ungroup()
    df.lc.summary <- df.lc.summary %>% inner_join(getPopList(), by=c("acronym")) %>% mutate(acr.name = paste(toupper(acronym), "-", name)) %>% arrange(acr.name)
    p <- ggplot(df.lc.summary) + geom_line(aes(x=year, y=ad, colour=acronym, group=acronym)) +
        facet_wrap(~ acr.name, ncol=4)
    p <- p + ylab("") + xlab("Artificialization degree (0=least, 1=maximum)")
    p <- p + theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.position = "none")
    return(p)
}

getDataEnteringHistory <- function(){
  df <- getDataFromJSON()
  df <- df %>% mutate(day = as.Date(substr(timestamp, 1, 10), "%d/%m/%Y")) %>%
    dplyr::select(day, acronym) %>%
    group_by(day) %>% summarise(acronym=paste(sort(unique(acronym)), collapse=",")) %>%
    arrange(desc(day))
  df
}
