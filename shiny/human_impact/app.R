source("../scripts/pophist.R")
ui <- fluidPage(
    fluidRow(
        titlePanel("Human impact"),
        column(12,
               div("Degree of human impact calculated with the following values per land cover category:
                   1 (Fd, B), 2 (Fd+, Bd+), 3 (Fs, S), 4 (Fs+, S+), 5 (W), 6 (W+, D), 7 (D+, A), 8 (A+), 9 (I), 10 (U)")
               ),
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
        column(8,
               plotOutput("cover_change", height=600)
        )
    )
)

server <- function(input, output) {

    output$cover_change <- renderPlot({
        p <- plotArticializationDegree(input$region)
        p
    })
}

shinyApp(ui = ui, server = server)

