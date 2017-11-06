<!DOCTYPE html>

<html>

<head>
    <title>Neighbourhood Map</title>
    <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes">
    <meta charset="utf-8">
    <link href="main.css" rel="stylesheet">
</head>

<body>
    <!-- This is the control Area where all the bindings are applied -->
    <div id="control-area">
        <div class="search-panel" data-bind="visible: openMenu">

            <img src="img/close-nav.svg" alt="Close" class="close-nav" data-bind="click: closeSearchMenu">

            <span class="header menu-header-text">Neighbourhood Map</span>
            <div class="search-input-container">
                <input type="text" placeholder="Search" class="search-input" data-bind="textInput : searchText">
            </div>
            <div class="search-result-container" data-bind="foreach: locations">
                <div class="search-result" data-bind="click: onSearchResultClick">
                    <span data-bind="text: name"></span>
                </div>
            </div>
        </div>

        <!-- This is the header of the application which is dynamically binded to be disapeared on menu open -->
        <header class="header" data-bind="visible: !openMenu()">
            <img src="img/open-nav.png" alt="Open" class="open-nav" data-bind="click: openSearchMenu, visible: !openMenu()">
            <span class="header-text">Neighbourhood Map</span>
        </header>
    </div>

    <!-- This is the area to load the map -->
    <div class="content">
        <div id="map"></div>
    </div>

    <!-- lib and src files prepared by grunt -->
    <script src="lib.js"></script>
    <script src="src.js"></script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDH6QHRcFA33MAwI4IZiqo1vJOdgMii0go&libraries=drawing,geometry&callback=googleMapHandler.initMap" onerror="googleMapHandler.handleMapError()"></script>
</body>

</html>