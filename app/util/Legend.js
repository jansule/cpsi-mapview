/**
 * Util class for legends related functions.
 *
 * @class CpsiMapview.util.Legend
 */
Ext.define('CpsiMapview.util.Legend', {
    alternateClassName: 'LegendUtil',
    requires: [
        'BasiGX.util.Object'
    ],

    singleton: true,

    /**
     * Creates a WMS getLegendGraphic request URL for the given OL layer.
     * For WMS it uses the standard WMS mechanism / information.
     * For WFS the assumption is that MapServer uses the same configuration for
     * WMS and WFS so we can create the getLegendGraphic the same way.
     * STYLE parameter is derived by the corresponding SLD file name
     * (see #getWmsStyleFromSldFile).
     *
     * @param  {ol.layer.Base} layer The OL layer to get the request URL for
     * @return {String}       The getLegendGraphic request URL
     */
    createGetLegendGraphicUrl: function (layer) {

        var source = layer.getSource();
        var url;
        var requestParams = '';

        var activatedStyle;
        if (layer.get('isWms') || layer.get('isVt')) {
            if (source.getUrls) {
                url = source.getUrls()[0];
            } else {
                url = source.getUrl(); // for a ol.source.ImageWMS layer
            }

            var layers;
            activatedStyle = layer.get('activatedStyle');

            if (layer.get('isVt')) {
                var splitUrl = url.toLowerCase().split('?');
                url = splitUrl[0];
                layers = Ext.Object.fromQueryString(splitUrl[1]).layers;
                activatedStyle = this.getWmsStyleFromSldFile(activatedStyle);
            } else {
                layers = BasiGX.util.Object.layersFromParams(source.getParams());
            }

            if (!url || !layers) {
                return;
            }

            // Remove possible duplicates created by adding labels
            // (CpsiMapview.view.menuitem.LayerLabels) because GetLegendGraphic
            // accepts only one layer in its LAYER param
            layers = LegendUtil.getUniqueLayersParam(layers);

            requestParams += 'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&';
            requestParams += 'FORMAT=image%2Fpng&TRANSPARENT=TRUE&SLD_VERSION=1.1.0&';
            requestParams += 'LAYER=' + layers + '&';
            if (activatedStyle) {
                requestParams += 'STYLE=' + activatedStyle;
            }

        } else if (layer.get('isWfs')) {

            url = layer.get('url');
            var ft = layer.get('featureType');
            activatedStyle = layer.get('activatedStyle');
            if (!url || !ft) {
                return;
            }

            requestParams += 'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&';
            requestParams += 'FORMAT=image%2Fpng&TRANSPARENT=TRUE&SLD_VERSION=1.1.0&';
            requestParams += 'LAYER=' + ft + '&';
            if (activatedStyle) {
                requestParams += 'STYLE=' + LegendUtil.getWmsStyleFromSldFile(activatedStyle);
            }
        }
        if (!url) {
            return;
        }

        if (!url.endsWith('?') && !url.endsWith('&')) {
            url += '?';
        }

        url += requestParams;

        return url;
    },

    /**
     * Derives the STYLE parameter by the corresponding SLD file name.
     * Convention is LAYERS_STYLES.xml (whereas in STYLES we replace blanks by
     * underscores), e.g. LightUnit_Unit_Type.xml => 'Unit Type'.
     *
     * @param  {String} sldFileName The SLD file name
     * @return {String}             The WMS STYLE parameter
     */
    getWmsStyleFromSldFile: function (sldFileName) {
        // LightUnit_Unit_Type.xml => ['LightUnit', 'Unit', 'Type']
        var parts = sldFileName
            .replace('.xml', '')
            .split('_');
        // remove first item since it is the LAYERS name
        parts.shift();
        // => 'Unit Type'
        return parts.join(' ');
    },

    /**
    * Derives the SLD file name by the corresponding WMS STYLES and LAYERS
    * parameter.
    * Convention is LAYERS_STYLES.xml (whereas for STYLES we replace blanks by
    * underscores), e.g. 'Unit Type' and 'LightUnit' => LightUnit_Unit_Type.xml
    *
     * @param  {String} wmsStyle  The WMS STYLE parameter
     * @param  {String} wmsLayers The WMS LAYERS parameter
     * @return {String}           The SLD file name
     */
    getSldFileFromWmsStyle: function (wmsStyle, wmsLayers) {
        return wmsLayers + '_' + wmsStyle.replace(' ', '_') + '.xml';
    },

    /**
     * Removes any duplicate layer name from the given LAYERS parameter value.
     *
     * @param  {String} layers WMS LAYERS parameter value, e.g. (layer1,layer2)
     * @return {String}        WMS LAYERS parameter without duplicates
     */
    getUniqueLayersParam: function (layers) {
        var layerList = Ext.isArray(layers) ? layers : layers.split(',');
        // remove any duplicate layer names
        var reducedLayerList = Ext.Array.unique(layerList);

        return reducedLayerList.join(',');
    }
});
