source("../scripts/pophist.R")
ui <- fluidPage(
    fluidRow(
        titlePanel("Land cover change"),
        column(7,
               selectInput("region", "Region:",
                           c("Andalucia" = "andalucia",
                             "Aragon" = "aragon",
                             "Asturias" = "asturias",
                             "Basque Country" = "basque_country",
                             "Cantabria" = "cantabria",
                             "Castilla-La Mancha" = "castilla_la-mancha",
                             "Castilla-Leon" = "castilla_leon",
                             "Catalonia" = "catalonia",
                             "Extremadura" = "extremadura",
                             "Galicia" = "galicia",
                             "La Rioja" = "la_rioja",
                             "Madrid" = "madrid",
                             "Murcia" = "murcia",
                             "Navarra" = "navarra",
                             "Valencia" = "valencia"))
        ),
        column(12,
               plotOutput("cover_change", height=600)
        )
    )
)

server <- function(input, output) {

   output$cover_change <- renderPlot({
       p <- plotCoverChange(input$region)
       p
   })
}

shinyApp(ui = ui, server = server)

