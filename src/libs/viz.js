import * as d3 from 'd3';
import * as i2d from 'i2djs';
import { vertexShader, fragmentShader} from './shaders';

export default function () {
	var heatmapLinearScale = d3.scaleLinear()
	    .range([6, 100]);

	var ActiveColorGrad = [{
            color: [0, 0, 0, 0.1], offset: 0
        }, {
            color: [102, 150, 74, 0.5], offset: 0.2
        }, {
            color: [166, 255, 115, 0.8], offset: 0.45
        }, {
            color: [255, 255, 0, 1.0], offset: 0.65
        }, {
            color: [255, 0, 0, 1.0], offset: 1.0
        }];

    var RecoveredColorGrad = [{
            color: [0, 0, 0, 0.1], offset: 0
        }, {
            color: [102, 150, 74, 0.5], offset: 0.5
        }, {
            color: [166, 255, 115, 1.0], offset: 1.0
        }];

     var DeceasedColorGrad = [{
            color: [0, 0, 0, 0.1], offset: 0
        }, {
            color: [255, 255, 0, 1.0], offset: 1.
        }];

     var ConfirmedColorGrad = [{
            color: [255, 0, 0, 0.1], offset: 0
        }, {
            color: [255, 255, 255, 1.0], offset: 1.
        }];


	var ActiveColorGradMap = gradientMapper(ActiveColorGrad);
	var RecoveredColorGradMap = gradientMapper(RecoveredColorGrad);
	var DeceasedColorGradMap = gradientMapper(DeceasedColorGrad);
	var ConfirmedColorGradMap = gradientMapper(ConfirmedColorGrad);
	var colorGradMap = ActiveColorGradMap;

	var dataType = '';
	// var tooltip;
	let Chart = function () {
		
	}

	Chart.prototype.dataType = function (val) {
		dataType = val.toLowerCase();
		if (dataType === 'active') {
			colorGradMap = ActiveColorGradMap;
		} else if (dataType === 'deceased') {
			colorGradMap = DeceasedColorGradMap;
		} else if (dataType === 'recovered') {
			colorGradMap = RecoveredColorGradMap;
		} else if (dataType === 'confirmed') {
			colorGradMap = ConfirmedColorGradMap;
		}
	};

	Chart.prototype.dataRange = function (range) {
		heatmapLinearScale.domain(range);
	};

	Chart.prototype.initialize = function (districtData) {
		let self = this;

		self.zoomInstance = i2d.behaviour.zoom();
		self.zoomInstance.scaleExtent([1, 15]);
		self.zoomInstance.zoomStart(zoomStart);
		self.zoomInstance.zoom(onZoom);
		self.zoomInstance.zoomEnd(zoomEnd);

		self.zoomInstance.panExtent([[-10000, -10000], [10000, 10000]]);

			self.renderGeoMap();
			self.renderHeatMap(districtData);

			// zoomInstance.zoomTarget([GeoMaprenderer.width / 2, GeoMaprenderer.height / 2]);

			function zoomStart (event) {
				// tooltip();
			}

			function onZoom (event) {
				var scale = event.transform.scale[0];
				var sqrtScale = Math.sqrt(1 / scale);
				self.geoGroup.setAttr('transform', event.transform);
				self.heatmapHref.setAttr('transform', event.transform);
				self.labelHref.setAttr('transform', event.transform);
				
				var nodes = self.heatmapHref.children;

				self.distG.setStyle('lineWidth', 0.16 / scale);
				self.stateG.setStyle('lineWidth', 0.3 / scale);

				for (var i = nodes.length - 1; i >= 0; i--) {
					var d = nodes[i].data();
					var val = d.d[dataType];
					val = val <= 0 ? 0 : heatmapLinearScale(Math.sqrt(val));

					nodes[i]
					.setAttr('width', val * sqrtScale)
					.setAttr('height', val * sqrtScale)
					.setAttr('x', d.xy[0] - ((val * 0.5) * sqrtScale))
					.setAttr('y', d.xy[1] - ((val * 0.5) * sqrtScale));
				};
			}

			function  zoomEnd (event) {
				var scale = event.transform.scale[0];
				var sqrtScale = Math.sqrt(1 / scale);
				var nodes = self.labelHref.children;
				if (scale >= 3.0) {
					self.labelHref.setStyle('display', true);
					for (var i = nodes.length - 1; i >= 0; i--) {
						var d = nodes[i].data();
						nodes[i].setStyle('font', 10 * sqrtScale +'px Arial');
						var width = nodes[i].attr.width;
						var height = nodes[i].attr.height;
						var val = d.d[dataType];
						val = val <= 0 ? 0 : heatmapLinearScale(Math.sqrt(val));
						
						nodes[i]
							.setAttr('x', d.xy[0] - ((width * 0.5)))
							.setAttr('y', d.xy[1] - ((val * 0.5) / scale));
					};
				} else {
					self.labelHref.setStyle('display', 'none');
				}
			}
	}

	Chart.prototype.update = function (argument) {
		this.heatmapHref.update();
	};

	Chart.prototype.renderGeoMap = function (argument) {
		var self = this;
		var GeoMaprenderer = i2d.canvasLayer('#map-container', {}, {});
		self.projection = d3.geoMercator()
			   .translate([GeoMaprenderer.width/2, GeoMaprenderer.height/2])
			   .center([78.96288, 20.593684])
			   .scale([Math.min(GeoMaprenderer.height , GeoMaprenderer.width) * 1.5]);
		        
		var path = d3.geoPath()
				  	 .projection(self.projection);

		renderLegend(GeoMaprenderer);

		this.geoGroup = GeoMaprenderer.createEl({
			el: 'group'
		});

		this.distG = this.geoGroup.createEl({
			el: 'group',
			style: {
				globalAlpha: 1,
				strokeStyle: '#c74a4a',
				fillStyle: 'rgba(0, 0, 1, 1)',
				lineWidth: 0.2
			},
			bbox: false
		});

		this.stateG = this.geoGroup.createEl({
			el: 'group',
			style: {
				strokeStyle: '#c74a4a',
				lineWidth: 0.5
			},
			bbox: false
		});

		var indiaDist = d3.json("https://nswamy14.github.io/geoJson/india.district.geo.json");
		var states = d3.json("https://nswamy14.github.io/geoJson/india.states.geo.json");
		Promise.all([indiaDist, states]).then(function(values) {
			var districtGeoData = values[0];
			var stateGeoData = values[1];
			var count = 0;

			stateGeoData.features.forEach(function (state) {
				self.stateG.createEl({
					el: 'path',
					attr: {
						d: path(state)
					}
				});
			});

			districtGeoData.features.forEach(function (dist) {
				self.distG.createEl({
					el: 'path',
					attr: {
						d: path(dist)
					}
				});
			});
		});

		function renderLegend (renderer) {
			var linearGradiant = renderer.createLinearGradient({
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 0,
				colorStops: [{
			            color: 'rgba(0, 0, 0, 0.0)', value: 0
			        }, {
			            color: 'rgba(212, 225, 255, 0.5)', value: 20
			        }, {
			            color: 'rgba(166, 255, 115, 0.8)', value: 45
			        }, {
			            color: 'rgba(255, 255, 0, 1.0)', value: 65
			        }, {
			            color: 'rgba(255, 0, 0, 1.0)', value: 100.0
			        }]
			});

			renderer.createEl({
				el: 'rect',
				attr: {
					x: renderer.width - 300,
					y: renderer.height - 200,
					width: 200,
					height: 20
				},
				style: {
					fillStyle: linearGradiant
				}
			});

			renderer.createEl({
				el: 'text',
				attr: {
					x: renderer.width - 300,
					y: renderer.height - 180 + 20,
					text: 'Low'
				},
				style: {
					fillStyle: '#888',
					textAlign: 'center'
				}
			});

			renderer.createEl({
				el: 'text',
				attr: {
					x: renderer.width - 100,
					y: renderer.height - 180 + 20,
					text: 'High'
				},
				style: {
					fillStyle: '#f00',
					textAlign: 'center'
				}
			});
		}
	};

	Chart.prototype.renderHeatMap = function (data) {
		let self = this;
		var webglRenderer = i2d.webglLayer('#map-container', {
	                premultipliedAlpha: false,
	                depth: false,
	                antialias: true,
	                alpha: true,
	                preserveDrawingBuffer: false
	            }, {
	            	enableEvents: true,
	            	enableResize: false
	            });
		webglRenderer.setClearColor(i2d.color.rgba(0, 0, 0, 0));
		webglRenderer.on('zoom', self.zoomInstance);
		var opacity = 1.0;

		var Texture = webglRenderer.TextureObject({
		        width: webglRenderer.width * webglRenderer.pixelRatio,
		        height: webglRenderer.height * webglRenderer.pixelRatio,
		        border: 0,
		        format: 'RGBA',
		        type: 'UNSIGNED_BYTE',
		        warpS: 'CLAMP_TO_EDGE',
		        warpT: 'CLAMP_TO_EDGE',
		        magFilter: 'LINEAR',
		        minFilter: 'LINEAR',
		        mipMap: false
		    });

		var renderTarget = webglRenderer.RenderTarget({
		        texture: Texture
		    });

		var labelGroup = webglRenderer.createEl({
		        el: 'group',
		        attr: {
		            shaderType: 'text'
		        },
		        style: {
		        	display: 'none'
		        }
		    });

		var imageGroup = webglRenderer.createEl({
		        el: 'group',
		        attr: {
		            shaderType: 'image'
		        },
		        renderTarget: renderTarget,
		        ctx: function (ctx) {
		            ctx.enable(ctx.BLEND);
		            ctx.blendEquation(ctx.FUNC_ADD);
		            ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
		            ctx.depthMask(true);
		        }
		    });

		var meshgeome = webglRenderer.MeshGeometry();
			meshgeome.setAttr('a_texCoord', {
			    value: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
			    size: 2
			});
			meshgeome.setDrawRange(0, 6);

			webglRenderer.createShaderEl({
			    fragmentShader: fragmentShader,
			    vertexShader: vertexShader,
			    uniforms: {
			        u_colorArr: {
			            value: colorGradMap.value,
			            size: 4
			        },
			        u_offset: {
			            value: colorGradMap.offset,
			            size: 1
			        },
			        u_framebuffer: {
			            value: Texture
			        }
			    },
			    bbox: false,
			    geometry: meshgeome
			});


		var TextureIns = webglRenderer.TextureObject({
			    width: 100,
			    height: 100,
			    src: getGradientImage()
			});

		data = data.map(function (d) {
			let xy = self.projection([d.longitude, d.latitude])
			return {
				xy: xy,
				d: d
			}
		});

		this.heatmapHref = imageGroup.join(data, 'image', {
			action: {
				enter: function (data) {
					this.createEls(data['image'], {
					        el: 'image',
					        attr: {
					            x: function  (d) {
					            	return d.xy[0]
					            },
					            y: function  (d) {
					            	return d.xy[1]
					            },
					            width: 0,
					            height: 0,
					            src: TextureIns
					        },
					        style: {
					        	opacity: 0
					        }
					    })
					.on('zoom', self.zoomInstance)
					.on('mousemove', function (e) {
						var d = this.data();
						// tooltip(d, e);
					})
					.on('mouseout', function (e) {
						// tooltip();
					});
				},
				update: function (nodes) {
					nodes['image'].forEach(function (dd) {
						var d = dd.d;
						var val = d[dataType];
						val = val <= 0 ? 0 : heatmapLinearScale(Math.sqrt(val));
						var op = Math.log(val || 1) / 5;
						op = (op > 1.0 ? 1.0 : op);
						var scale = self.zoomInstance.event.transform.scale[0];
						this.animateTo({
					    	duration: 100,
					    	attr: {
					    		width: val / scale,
					    		height: val / scale,
					    		x: dd.xy[0] - ((val * 0.5) / scale),
					    		y: dd.xy[1] - ((val * 0.5) / scale)
					    	},
					    	style: {
					    		opacity: op
					    	}
					    });
					})
				}
			}
		});

		this.labelHref = labelGroup.join(data, 'text', {
			action: {
				enter: function (data) {
					this.createEls(data['text'], {
					        el: 'text',
					        attr: {
					            x: function  (d) {
					            	return d.xy[0] - (d.d.name.length)
					            },
					            y: function  (d) {
					            	return d.xy[1] + 10
					            },
					            text: function (d) {
					            	return d.d.name
					            }
					        },
					        style: {
					        	font: "10px Arial",
								fillStyle: '#dba9a9'
								// opacity: 0.5
					        }
					    })
					.on('zoom', self.zoomInstance)
					.on('mousemove', function (e) {
						var d = this.data();
						// tooltip(d, e);
					})
					.on('mouseout', function (e) {
						// tooltip();
					});
				},
				update: function (nodes) {
					// nodes['text'].forEach(function (d) {
					// 	var active = d.active;
					// 	active = active <= 0 ? 0 : heatmapLinearScale(Math.sqrt(active));
					// 	var op = Math.log(active || 1) / 5;
					// 	op = (op > 1.0 ? 1.0 : op);
					// 	var scale = zoomInstance.event.transform.scale[0];
					// 	this.animateTo({
					//     	duration: 100,
					//     	attr: {
					//     		width: active / scale,
					//     		height: active / scale,
					//     		x: d.xy[0] - ((active * 0.5) / scale),
					//     		y: d.xy[1] - ((active * 0.5) / scale)
					//     	},
					//     	style: {
					//     		opacity: op
					//     	}
					//     });
					// })
				}
			}
		});
	}

	function getGradientImage () {
		var radialGrad = i2d.canvasLayer(null,{}, {});
		    radialGrad.setPixelRatio(1);
		    radialGrad.setSize(100, 100);

		var radialGradiant = radialGrad.createRadialGradient({
		                innerCircle: { x: 50, y: 50, r: 0 },
		                outerCircle: { x: 50, y: 50, r: 50 },
		                mode: 'percent',
		                colorStops: [{ color: 'rgba(0, 0, 0, 1)', value: 0 },
		                    { color: 'rgba(0, 0, 0, 0)', value: 100 }]
		            });

			radialGrad.createEl({
		                el:'circle',
		                attr:{
		                    r: 50, cx: 50, cy: 50
		                },
		                style:{
		                    fillStyle: radialGradiant
		                }
		            });
			radialGrad.execute();

			return radialGrad;
	}

	function gradientMapper (grad) {
	    const arr = [];
	    const gradLength = grad.length;
	    const offSetsArray = [];

	    grad.forEach(function (d) {
	        arr.push(d.color[0] / 255);
	        arr.push(d.color[1] / 255);
	        arr.push(d.color[2] / 255);
	        arr.push(d.color[3] === undefined ? 1.0 : d.color[3]);
	        offSetsArray.push(d.offset);
	    });
	    return {
	        value: new Float32Array(arr),
	        length: gradLength,
	        offset: new Float32Array(offSetsArray)
	    };
	}

	return new Chart();
}