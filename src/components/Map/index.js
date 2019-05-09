import React, { Component, Fragment } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, Image, TouchableOpacity, PermissionsAndroid } from 'react-native';
import { Icon } from 'react-native-elements';
import Geocoder from 'react-native-geocoding';

import Search from '../Search';
import Directions from '../Directions';
import Details from '../Details';
import { getPixelSize } from '../utils';

import markerImage from '../../assets/marker.png';
import backImage from '../../assets/back.png';
import {
  Back,
  LocationBox,
  LocationText,
  LocationTimeBox,
  LocationTimeText,
  LocationTimeTextSmall
} from './styles';

Geocoder.init('AIzaSyATTACCkf4wUveDWbW4RTaE6UN6063jufA');

export default class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      region: null,
      destination: null,
      duration: null,
      location: null
    };
    this.requestLocationPermission();
  }

  requestLocationPermission = async () => {

    try {
        const response = await PermissionsAndroid
            .request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        if (response === PermissionsAndroid.RESULTS.GRANTED)
            return true;

        return false;

    } catch (err) {
        return false;
    }
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {

        const response = await Geocoder.from({ latitude, longitude });
        const address = response.results[0].formatted_address;
        const location = address.substring(0, address.indexOf(','));

        this.setState({
          location,
          region: {
            latitude,
            longitude,
            latitudeDelta: 0.0143,
            longitudeDelta: 0.0134
          }
        });
      },
      () => { },
      {
        timeout: 2000,
        enableHighAccuracy: true,
        maximumAge: 1000
      }
    );
  }

  handleLocationSelected = (data, { geometry }) => {
    const { location: { lat: latitude, lng: longitude } } = geometry;

    this.setState({
      destination: {
        latitude,
        longitude,
        title: data.structured_formatting.main_text
      }
    });
  }

  handleBack = () => {
    this.setState({
      destination: null
    })
  }

  _watchLocation = async () => {
    await navigator.geolocation.watchPosition(position => {
      this.setState({ region: position.coords });
    });
  };

  _getLocation = async () => {
    await navigator.geolocation.getCurrentPosition(position => {
      this.animateMap(position.coords);
    });
  };

  animateMap = (coords) => {
    this.mapView.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.01
    }, 1000);
  }

  render() {

    const { region, destination, duration, location } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <MapView
          ref={map => this.mapView = map}
          style={{ flex: 1 }}
          region={region}
          loadingEnabled
          loadingBackgroundColor="#333"
          loadingIndicatorColor="#000"
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsPointsOfInterest={true}
          showsCompass={false}
          showsBuildings={false}
          showsTraffic={false}
          rotateEnabled={false}
          zoomEnabled={true}
          mapType="standard">

          {destination && (
            <Fragment>
              <Directions
                origin={region}
                destination={destination}
                onReady={(result) => {
                  this.setState({
                    duration: Math.floor(result.duration)
                  });
                  this.mapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: getPixelSize(50),
                      left: getPixelSize(50),
                      top: getPixelSize(50),
                      bottom: getPixelSize(350)
                    }
                  });
                }}
              />
              <Marker
                coordinate={destination}
                anchor={{ x: 0, y: 0 }}
                image={markerImage}>

                <LocationBox>
                  <LocationText>{destination.title}</LocationText>
                </LocationBox>

              </Marker>

              <Marker
                coordinate={region}
                anchor={{ x: 0, y: 0 }}>

                <LocationBox>
                  <LocationTimeBox>
                    <LocationTimeText>{duration}</LocationTimeText>
                    <LocationTimeTextSmall>MIN</LocationTimeTextSmall>
                  </LocationTimeBox>
                  <LocationText>{location}</LocationText>
                </LocationBox>

              </Marker>
            </Fragment>
          )}

        </MapView>

        {destination ? (
          <Fragment>
            <Back onPress={this.handleBack}>
              <Image source={backImage} />
            </Back>
            <Details duration={duration} />
          </Fragment>

        ) : (
            <Search onLocationSelected={this.handleLocationSelected} />
          )}

        <Icon name='crosshairs-gps' type='material-community'
          raised
          component={TouchableOpacity}
          size={20}
          onPress={this._getLocation}
          color={'#000'}
          containerStyle={{
            position: 'absolute',
            right: '5%',
            bottom: '6%',
            opacity: 1,
          }} />

      </View>
    );
  }
}
