library(dplyr)
library(readxl)
library(stringr)
library(DT)
library(shiny)

source("../scripts/pophist.R")

ui <- fluidPage(
    fluidRow(
        titlePanel("Data status"),
        column(7,
            div("Cells with no values correspond to combinations of populations-years which are not available and therefore need not to be done")
        ),
        column(12,
               dataTableOutput("data_status")
        )
    )
)

server <- function(input, output, session) {
    output$data_status <- renderDataTable({
        dfst <- getDataStatus()
        df <- datatable(dfst,
                        list(lengthChange = FALSE, pageLength = dim(dfst)[1]), rownames = F) %>%
            formatStyle(
            2:dim(dfst)[2],
            backgroundColor = styleInterval(c(1,79), c('#FADBD8', '#FDEBD0', '#D5F5E3')),
            color = styleInterval(c(1,79), c('red', 'orange', 'green'))
        )
        df

    })

}

shinyApp(ui = ui, server = server)
