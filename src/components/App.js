// ==========================================main react component======================================================

import React, { Component } from "react";
import {
  Button,
  Col,
  Container,
  Row,
  Form,
  ListGroup,
  Spinner,
  Card,
  Navbar,
} from "react-bootstrap";
import ms from "pretty-ms";
import didYouMean, { ReturnTypeEnums } from "didyoumean2";
import { GreatThings } from "moving-letters";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tagInput: "",
      apiResponse: "",
      postsList: [],
      statusArray: [],
      showAll: true,
      onePost: {},
      userTags: new Array(1),
      suggestedUserTags: new Array(1),
      searchBox: [],
      showList: false,
      showLoading: false,
      showLoadingButton: false,
      showHeading: true,
      authorsListArray: [],
    };
  }

  // ====================================handler to get the fetch blog=============================

  getPage = async () => {
    for (let i = 0; i < this.state.statusArray.length; i++) {
      let tempArray = [...this.state.statusArray];
      tempArray[i].status = "Crawling....";
      this.setState({
        statusArray: tempArray,
      });
      let time = new Date().getTime();
      await fetch(`http://localhost:9000/getPage?url=${tempArray[i].url}&author=${tempArray[i].author}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.pageResponse !== undefined) {
            let post = {
              pageResponse: res.pageResponse,
              tags: res.pageResponse.tags,
              responses: res.pageResponse.responses,
            };
            tempArray[i].status = "completed";
            tempArray[i].details = post;
            time = new Date().getTime() - time;
            tempArray[i].responseTime = ms(time);
            this.setState({
              statusArray: tempArray,
            });
          }
        });
    }
  };

  // ==============================for user input=============================================

  inputHandler = (e) => {
    const { userTags, suggestedUserTags } = this.state;

    let matchList = [...userTags, ...suggestedUserTags];

    let suggestionarr = didYouMean(e.target.value, matchList, {
      returnType: ReturnTypeEnums.ALL_MATCHES,
    });

    if (suggestionarr !== undefined) {
      this.setState({
        searchBox: suggestionarr,
        showList: true,
      });
    }
    this.setState({
      tagInput: e.target.value,
      showHeading: false,
    });
  };

  searchHandler = async () => {
    this.setState({
      showLoading: true,
    });
    await fetch(`http://localhost:9000/getPage/tag/${this.state.tagInput}`)
      .then((res) => res.json())
      .then((res) =>
        this.setState({
          postsList: res.pageResponse.hrefListArray,
          authorsListArray: res.pageResponse.authorsListArray,
          showList: false,
          showLoading: false,
          showHeading: false,
        })
      );
    let statusArray = new Array(this.state.postsList.length);
    for (let i = 0; i < statusArray.length && i < this.state.authorsListArray.length; i++) {
      statusArray[i] = {
        status: "Pending....",
        url: this.state.postsList[i],
        details: {},
        responseTime: "",
        author: this.state.authorsListArray[i],
      };
    }
    this.setState({
      statusArray: statusArray,
      showAll: true,
      onePost: {},
    });

    await this.getPage();
  };

  openOne = (status) => {
    this.setState({
      showAll: false,
      onePost: status,
    });
  };

  inputTagHandler = (tag) => {
    this.setState(
      {
        tagInput: tag,
        showList: false,
      },
      this.searchHandler
    );
    console.log("tag is" + tag);
  };

  // =========================================load more handler================================

  loadMoreHandler = async () => {
    this.setState({
      showLoadingButton: true,
    });
    await fetch(`http://localhost:9000/getPage/loadMore/${this.state.tagInput}`)
      .then((res) => res.json())
      .then((res) =>
        this.setState({
          postsList: res.pageResponse.hrefListArray,
          showLoadingButton: false,
        })
      );
    let statusArray = new Array(this.state.postsList.length);
    for (let i = 0; i < statusArray.length; i++) {
      statusArray[i] = {
        status: "Pending....",
        url: this.state.postsList[i],
        details: {},
        responseTime: "",
      };
    }
    this.setState({
      statusArray: statusArray,
      showAll: true,
      onePost: {},
    });

    await this.getPage();
  };

  getUserTags = async () => {
    await fetch(`http://localhost:9000/users/getTags`)
      .then((res) => res.json())
      .then((res) => {
        this.setState({
          userTags: res.tags,
          suggestedUserTags: res.suggestedTags,
        });
      });
  };

  showAllHandler = () => {
    this.setState({
      showAll: true,
    });
  };

  componentDidMount = () => {
    this.getUserTags();
  };

  render() {
    const { onePost } = this.state;
    return (
      <div>
        <Container fluid className="my-container">
          <Row noGutters>
            <Col>
              <Navbar bg="light" expand="lg">
                <Navbar.Brand href="#home">React-Crawler </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
              </Navbar>
            </Col>
          </Row>
        </Container>
        <Container fluid>
          <Row>
            <Col lg={10}>
              <Row className="input-row">
                <Col lg={10}>
                  <Form>
                    <Form.Group controlId="tagInput">
                      <Form.Control
                        type="text"
                        placeholder="Interesting blogs are on the way, type a word... "
                        onChange={this.inputHandler}
                        value={this.state.tagInput}
                      />
                    </Form.Group>
                    <ListGroup>
                      {this.state.showList &&
                        this.state.searchBox.map((key) => (
                          <ListGroup.Item
                            onClick={() => this.inputTagHandler(key)}
                          >
                            {key}
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  </Form>
                </Col>
                <Col lg={2}>
                  <Button
                    variant="outline-primary"
                    type="button"
                    onClick={this.searchHandler}
                    id="search-button"
                  >
                    Submit
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  {this.state.showHeading && (
                    <div className="moving-text">
                      <GreatThings text=" Hello Admin! great blogs ahead." />
                      <div id="suggested-tag-box">
                        <h5>Suggested tags</h5>
                        <ListGroup horizontal className="horizontal-tag-list">
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("web")}
                          >
                            web
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("ios")}
                          >
                            ios
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("food")}
                          >
                            food
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("life")}
                          >
                            life
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("linux")}
                          >
                            linux
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("bank")}
                          >
                            bank
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("android")}
                          >
                            android
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("hollywood")}
                          >
                            hollywood
                          </Button>
                          <Button
                            className="tag-buttons"
                            variant="secondary"
                            onClick={() => this.inputTagHandler("usa")}
                          >
                            usa
                          </Button>
                        </ListGroup>
                      </div>
                    </div>
                  )}
                  {this.state.showLoading && (
                    <span>
                      <Spinner animation="grow" variant="info" />
                      <Spinner animation="grow" variant="info" size="sm" /> We
                      are fetching interesting blogs for you
                    </span>
                  )}
                  {this.state.showAll ? (
                    <ListGroup>
                      {this.state.statusArray.map((status, ind) =>
                        status.status !== "completed" ? (
                          <ListGroup.Item>
                            <small>{ind + 1} </small>
                            <p>
                              {status.status}
                              {status.status === "Pending...." ? (
                                <Spinner
                                  animation="border"
                                  variant="primary"
                                  size="sm"
                                />
                              ) : (
                                <Spinner
                                  animation="border"
                                  variant="success"
                                  size="sm"
                                />
                              )}
                            </p>
                          </ListGroup.Item>
                        ) : (
                          <ListGroup.Item>
                            <Card>
                              <Card.Header>
                                {status.author}
                              </Card.Header>
                              <Card.Body>
                                <Card.Title className="blog-heading">
                                  {status.details.pageResponse.heading}
                                </Card.Title>

                                <Card.Text>
                                  {status.details.pageResponse.blogContent}
                                </Card.Text>

                                {status.details.tags.map((tag) => (
                                  <Button
                                    onClick={() =>
                                      this.inputTagHandler(
                                        tag.substr(tag.lastIndexOf("/") + 1)
                                      )
                                    }
                                    size="sm"
                                    style={{ marginRight: "10px" }}
                                    variant="secondary"
                                  >
                                    {tag.substr(tag.lastIndexOf("/") + 1)}
                                  </Button>
                                ))}

                                <div style={{ marginTop: "20px" }}>
                                  <Button onClick={() => this.openOne(status)}>
                                    Read More...
                                  </Button>
                                </div>
                              </Card.Body>
                              <Card.Footer className="text-muted">
                                Page Load Time:- {status.responseTime}
                              </Card.Footer>
                            </Card>
                          </ListGroup.Item>
                        )
                      )}
                    </ListGroup>
                  ) : (
                    <Card>
                      <Card.Header>{onePost.details.currentAuthor}</Card.Header>
                      <Card.Body>
                        <Card.Title className="blog-heading">
                          {onePost.details.pageResponse.heading}
                        </Card.Title>
                        <Card.Text>
                          {onePost.details.pageResponse.wholeBlogContent.map(
                            (para) => (
                              <p className="blog-para">{para}</p>
                            )
                          )}
                        </Card.Text>

                        {onePost.details.tags.map((tag) => (
                          <Button
                            onClick={() =>
                              this.inputTagHandler(
                                tag.substr(tag.lastIndexOf("/") + 1)
                              )
                            }
                            size="sm"
                            style={{ marginRight: "10px" }}
                            variant="secondary"
                          >
                            {tag.substr(tag.lastIndexOf("/") + 1)}
                          </Button>
                        ))}

                        <ListGroup>
                          <h5>
                            <img
                              src="https://www.flaticon.com/svg/static/icons/svg/126/126501.svg"
                              style={{ height: "24px", width: "24px" }}
                              alt="Responses"
                            />
                            {onePost.details.responses !== undefined && (
                              <small> {onePost.details.responses.length}</small>
                            )}
                          </h5>
                          {onePost.details.responses.map((response) => (
                            <ListGroup.Item> {response} </ListGroup.Item>
                          ))}
                        </ListGroup>

                        {this.state.showLoadingButton ? (
                          <Button variant="primary" disabled>
                            <Spinner
                              as="span"
                              animation="grow"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                            Loading...
                          </Button>
                        ) : (
                          <Button onClick={this.loadMoreHandler}>
                            Load More
                          </Button>
                        )}

                        <Button
                          onClick={this.showAllHandler}
                          style={{ marginLeft: "20px" }}
                        >
                          Show All
                        </Button>
                      </Card.Body>
                      <Card.Footer>
                        Page Load Time:- {onePost.responseTime}
                      </Card.Footer>
                    </Card>
                  )}
                </Col>
              </Row>
            </Col>
            <Col lg={2}>
              <Card className="history-card">
                <Card.Header>Search History</Card.Header>
                <ListGroup className="history-list">
                  {this.state.userTags.map((tag) => (
                    <ListGroup.Item onClick={() => this.inputTagHandler(tag)}>
                      {tag}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col lg={10}></Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
